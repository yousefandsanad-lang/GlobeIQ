import { useState, useEffect } from 'react'
import countries from '../data/countries.js'

const STORAGE_KEY = 'globeiq_daily_country'
const RECENT_KEY = 'globeiq_recent'
const MAX_GUESSES = 7
const RECENT_LIMIT = 5
const MIN_POOL = 3

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function loadRecent() {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveRecent(ids) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(ids))
  } catch {}
}

function seededIndex(dateStr, poolSize) {
  let hash = 0
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) & 0xffffffff
  }
  return Math.abs(hash) % poolSize
}

function pickFromAvailable(collectedCountries) {
  const recent = loadRecent()
  const sorted = [...countries].sort((a, b) => a.id.localeCompare(b.id))
  const afterCollected = sorted.filter(c => !collectedCountries.includes(String(c.id)))
  const pool = afterCollected.length > 0 ? afterCollected : sorted
  const afterRecent = pool.filter(c => !recent.includes(String(c.id)))
  const finalPool = afterRecent.length >= MIN_POOL ? afterRecent : pool
  return finalPool[seededIndex(todayKey(), finalPool.length)]
}

function addToRecent(id) {
  const recent = loadRecent()
  const updated = [String(id), ...recent.filter(r => r !== String(id))].slice(0, RECENT_LIMIT)
  saveRecent(updated)
}

export default function useGameLogic(collectedCountries = []) {
  const [currentCountry, setCurrentCountry] = useState(null)
  const [guesses, setGuesses] = useState([])
  const [guessCount, setGuessCount] = useState(0)
  const [gameStatus, setGameStatus] = useState('playing')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let restored = null
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const saved = JSON.parse(raw)
        if (saved.date === todayKey()) {
          const country = countries.find(c => c.id === saved.countryId)
          if (country) {
            restored = {
              country,
              guesses: saved.guesses ?? [],
              guessCount: saved.guessCount ?? 0,
              gameStatus: saved.gameStatus ?? 'playing',
            }
          }
        }
      }
    } catch {
      restored = null
    }

    if (restored) {
      setCurrentCountry(restored.country)
      setGuesses(restored.guesses)
      setGuessCount(restored.guessCount)
      setGameStatus(restored.gameStatus)
    } else {
      const next = pickFromAvailable(collectedCountries)
      addToRecent(next.id)
      setCurrentCountry(next)
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded || !currentCountry) return
    const payload = {
      date: todayKey(),
      countryId: currentCountry.id,
      guesses,
      guessCount,
      gameStatus,
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch {
      // ignore quota / unavailable storage
    }
  }, [loaded, currentCountry, guesses, guessCount, gameStatus])

  function makeGuess(name) {
    if (gameStatus !== 'playing') return
    if (guessCount >= MAX_GUESSES) return

    const trimmed = name.trim()
    const guessedCountry = countries.find(c =>
      c.name.toLowerCase() === trimmed.toLowerCase() ||
      (c.aliases?.some(a => a.toLowerCase() === trimmed.toLowerCase()) ?? false)
    )
    if (guessedCountry && collectedCountries.includes(String(guessedCountry.id))) {
      return 'already_collected'
    }

    const newCount = guessCount + 1
    setGuesses(prev => [...prev, name])
    setGuessCount(newCount)

    const normalizedGuess = name.trim().toLowerCase()
    const isCorrect =
      currentCountry &&
      (normalizedGuess === currentCountry.name.toLowerCase() ||
        (currentCountry.aliases?.some(a => a.toLowerCase() === normalizedGuess) ?? false))

    if (isCorrect) {
      setGameStatus('won')
    } else if (newCount >= MAX_GUESSES) {
      setGameStatus('lost')
    }
  }

  function resetGame() {
    const next = pickFromAvailable(collectedCountries)
    addToRecent(next.id)
    setCurrentCountry(next)
    setGuesses([])
    setGuessCount(0)
    setGameStatus('playing')
  }

  return {
    currentCountry,
    guesses,
    guessCount,
    gameStatus,
    makeGuess,
    resetGame,
  }
}
