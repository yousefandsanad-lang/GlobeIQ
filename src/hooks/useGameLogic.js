import { useState, useEffect } from 'react'
import countries from '../data/countries.js'

const STORAGE_KEY = 'globeiq_daily_country'
const RECENT_KEY = 'globeiq_recent'
const MAX_GUESSES = 7
const RECENT_LIMIT = 5

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

const DATE_OVERRIDES = {
  '2026-05-04': '170', // Colombia     (medium) — launch day override
  '2026-05-05': '710', // South Africa (easy)  — replaces Ethiopia (medium)
  '2026-05-06': '250', // France       (easy)  — replaces Eritrea (hard)
  '2026-05-08': '152', // Chile    (medium)  — replaces Fiji (hard, no silhouette)
}

function pickForDate(dateStr) {
  const sorted = [...countries].sort((a, b) => a.id.localeCompare(b.id))
  const overrideId = DATE_OVERRIDES[dateStr]
  if (overrideId) {
    return sorted.find(c => c.id === overrideId) ?? sorted[seededIndex(dateStr, sorted.length)]
  }
  return sorted[seededIndex(dateStr, sorted.length)]
}

function addToRecent(id) {
  const recent = loadRecent()
  const updated = [String(id), ...recent.filter(r => r !== String(id))].slice(0, RECENT_LIMIT)
  saveRecent(updated)
}

export default function useGameLogic(collectedCountries = [], devDateKey = null) {
  const [currentCountry, setCurrentCountry] = useState(null)
  const [guesses, setGuesses] = useState([])
  const [guessCount, setGuessCount] = useState(0)
  const [gameStatus, setGameStatus] = useState('playing')
  const [loaded, setLoaded] = useState(false)

  const dateKey = devDateKey ?? todayKey()

  useEffect(() => {
    const todaysCountry = pickForDate(dateKey)
    let restored = null

    // In dev mode skip localStorage restore so every offset starts fresh
    if (!devDateKey) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const saved = JSON.parse(raw)
          if (saved.date === dateKey && saved.countryId === todaysCountry.id) {
            restored = {
              country: todaysCountry,
              guesses: saved.guesses ?? [],
              guessCount: saved.guessCount ?? 0,
              gameStatus: saved.gameStatus ?? 'playing',
            }
          }
        }
      } catch {
        restored = null
      }
    }

    if (restored) {
      setCurrentCountry(restored.country)
      setGuesses(restored.guesses)
      setGuessCount(restored.guessCount)
      setGameStatus(restored.gameStatus)
    } else {
      addToRecent(todaysCountry.id)
      setCurrentCountry(todaysCountry)
      setGuesses([])
      setGuessCount(0)
      setGameStatus('playing')
      if (typeof gtag !== 'undefined') {
        gtag('event', 'game_started', {
          difficulty: todaysCountry.difficulty,
          continent: todaysCountry.continent,
        })
      }
    }
    setLoaded(true)
  }, [dateKey])

  useEffect(() => {
    if (!loaded || !currentCountry || devDateKey) return
    const payload = {
      date: dateKey,
      countryId: currentCountry.id,
      guesses,
      guessCount,
      gameStatus,
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch {}
  }, [loaded, currentCountry, guesses, guessCount, gameStatus])

  function makeGuess(name) {
    if (gameStatus !== 'playing') return
    if (guessCount >= MAX_GUESSES) return

    const trimmed = name.trim()
    const guessedCountry = countries.find(c =>
      c.name.toLowerCase() === trimmed.toLowerCase() ||
      (c.aliases?.some(a => a.toLowerCase() === trimmed.toLowerCase()) ?? false)
    )
    if (!devDateKey && guessedCountry && collectedCountries.includes(String(guessedCountry.id))) {
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
      if (typeof gtag !== 'undefined') {
        gtag('event', 'game_won', {
          guesses_taken: newCount,
          country: currentCountry.name,
        })
      }
    } else if (newCount >= MAX_GUESSES) {
      setGameStatus('lost')
      if (typeof gtag !== 'undefined') {
        gtag('event', 'game_lost', {
          country: currentCountry.name,
        })
      }
    }
  }

  function resetGame() {
    const next = pickForDate(dateKey)
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
