import { useState, useEffect } from 'react'

const STORAGE_KEY = 'globeiq_streak'

function getTodayString() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getYesterdayString() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function persist(currentStreak, bestStreak, lastPlayedDate) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ currentStreak, bestStreak, lastPlayedDate })
    )
  } catch {
    // ignore quota / unavailable storage
  }
}

export default function useStreak() {
  const [currentStreak, setCurrentStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [lastPlayedDate, setLastPlayedDate] = useState(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (typeof parsed.currentStreak === 'number') setCurrentStreak(parsed.currentStreak)
        if (typeof parsed.bestStreak === 'number') setBestStreak(parsed.bestStreak)
        if (typeof parsed.lastPlayedDate === 'string') setLastPlayedDate(parsed.lastPlayedDate)
      }
    } catch {
      // leave defaults
    }
  }, [])

  function recordWin() {
    const today = getTodayString()
    if (lastPlayedDate === today) return

    const yesterday = getYesterdayString()
    const nextCurrent = lastPlayedDate === yesterday ? currentStreak + 1 : 1
    const nextBest = nextCurrent > bestStreak ? nextCurrent : bestStreak

    setCurrentStreak(nextCurrent)
    setBestStreak(nextBest)
    setLastPlayedDate(today)
    persist(nextCurrent, nextBest, today)
  }

  function recordLoss() {
    const today = getTodayString()
    if (lastPlayedDate === today) return

    setCurrentStreak(0)
    setLastPlayedDate(today)
    persist(0, bestStreak, today)
  }

  function getStreak() {
    return { currentStreak, bestStreak }
  }

  return { currentStreak, bestStreak, recordWin, recordLoss, getStreak }
}
