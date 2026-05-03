import { useState, useEffect } from 'react'

const STORAGE_KEY = 'globeiq_mode'
const FREE_BONUS_LIMIT = 3

function getTodayString() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function persist(mode, bonusPlaysToday) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ mode, bonusPlaysToday, date: getTodayString() })
    )
  } catch {
    // ignore quota / unavailable storage
  }
}

export default function usePuzzleMode() {
  const [mode, setMode] = useState('daily')
  const [bonusPlaysToday, setBonusPlaysToday] = useState(0)
  const proUser = false

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed.mode === 'daily' || parsed.mode === 'bonus') {
          setMode(parsed.mode)
        }
        if (parsed.date === getTodayString() && typeof parsed.bonusPlaysToday === 'number') {
          setBonusPlaysToday(parsed.bonusPlaysToday)
        } else {
          setBonusPlaysToday(0)
        }
      }
    } catch {
      // leave defaults
    }
  }, [])

  function canPlayBonus() {
    if (proUser) return true
    if (bonusPlaysToday < FREE_BONUS_LIMIT) return true
    return false
  }

  function unlockBonus() {
    console.log('Ad completed')
    const next = bonusPlaysToday + 1
    setBonusPlaysToday(next)
    persist(mode, next)
  }

  function switchMode(newMode) {
    setMode(newMode)
    persist(newMode, bonusPlaysToday)
  }

  return {
    mode,
    bonusPlaysToday,
    proUser,
    canPlayBonus,
    unlockBonus,
    switchMode,
    FREE_BONUS_LIMIT,
  }
}
