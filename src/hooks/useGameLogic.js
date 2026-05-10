import { useState, useEffect } from 'react'
import countries from '../data/countries.js'

const GAME_KEY = 'globeiq_current_game'
const FAILS_KEY = 'globeiq_recent_fails'
const MAX_GUESSES = 7
const FAILS_LIMIT = 10

function loadFails() {
  try {
    const raw = localStorage.getItem(FAILS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveFails(ids) {
  try { localStorage.setItem(FAILS_KEY, JSON.stringify(ids)) } catch {}
}

function recordFail(id) {
  const fails = loadFails()
  const updated = [String(id), ...fails.filter(f => f !== String(id))].slice(0, FAILS_LIMIT)
  saveFails(updated)
}

function pickNext(collectedCountries) {
  const fails = loadFails()
  const sorted = [...countries].sort((a, b) => a.id.localeCompare(b.id))

  // Exclude already collected — never override this with a fallback
  let pool = sorted.filter(c => !collectedCountries.includes(String(c.id)))
  if (pool.length === 0) pool = sorted  // absolute last resort: all 195 collected somehow

  // Exclude recently failed — only skip if at least 1 uncollected non-failed country remains
  const withoutFails = pool.filter(c => !fails.includes(String(c.id)))
  const finalPool = withoutFails.length >= 1 ? withoutFails : pool

  return finalPool[Math.floor(Math.random() * finalPool.length)]
}

export default function useGameLogic(collectedCountries = [], atlasLoaded = false) {
  const [currentCountry, setCurrentCountry] = useState(null)
  const [guesses, setGuesses] = useState([])
  const [guessCount, setGuessCount] = useState(0)
  const [gameStatus, setGameStatus] = useState('playing')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // Wait until atlas is fully loaded so we never pick an already-collected country
    if (!atlasLoaded) return

    let restored = null
    try {
      const raw = localStorage.getItem(GAME_KEY)
      if (raw) {
        const saved = JSON.parse(raw)
        // Only restore in-progress games for uncollected countries
        if (saved.gameStatus === 'playing') {
          const country = countries.find(c => c.id === saved.countryId)
          if (country && !collectedCountries.includes(String(country.id))) {
            restored = {
              country,
              guesses: saved.guesses ?? [],
              guessCount: saved.guessCount ?? 0,
              gameStatus: 'playing',
            }
          }
        }
      }
    } catch { restored = null }

    if (restored) {
      setCurrentCountry(restored.country)
      setGuesses(restored.guesses)
      setGuessCount(restored.guessCount)
      setGameStatus(restored.gameStatus)
    } else {
      const next = pickNext(collectedCountries)
      setCurrentCountry(next)
    }
    setLoaded(true)
  }, [atlasLoaded])

  // Safeguard: if currentCountry somehow ends up already collected, replace it immediately
  useEffect(() => {
    if (!currentCountry || !atlasLoaded || gameStatus !== 'playing') return
    if (collectedCountries.includes(String(currentCountry.id))) {
      const next = pickNext(collectedCountries)
      setCurrentCountry(next)
      setGuesses([])
      setGuessCount(0)
      try { localStorage.removeItem(GAME_KEY) } catch {}
    }
  }, [currentCountry?.id, collectedCountries, atlasLoaded])

  // Persist in-progress game only
  useEffect(() => {
    if (!loaded || !currentCountry) return
    if (gameStatus === 'playing') {
      try {
        localStorage.setItem(GAME_KEY, JSON.stringify({
          countryId: currentCountry.id,
          guesses,
          guessCount,
          gameStatus,
        }))
      } catch {}
    } else {
      // Clear saved game when done
      try { localStorage.removeItem(GAME_KEY) } catch {}
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

    const normalizedGuess = trimmed.toLowerCase()
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
      recordFail(currentCountry.id)
      setGameStatus('lost')
      if (typeof gtag !== 'undefined') {
        gtag('event', 'game_lost', {
          country: currentCountry.name,
        })
      }
    }
  }

  function nextCountry() {
    const next = pickNext(collectedCountries)
    setCurrentCountry(next)
    setGuesses([])
    setGuessCount(0)
    setGameStatus('playing')
  }

  function skipCountry() {
    if (currentCountry) recordFail(currentCountry.id) // avoid immediate repeat
    try { localStorage.removeItem(GAME_KEY) } catch {}
    nextCountry()
  }

  return { currentCountry, guesses, guessCount, gameStatus, makeGuess, nextCountry, skipCountry }
}
