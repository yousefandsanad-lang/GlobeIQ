import { useState, useEffect } from 'react'
import { syncStreakToCloud, loadStreakFromCloud } from '../utils/syncService'

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

function readLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        currentStreak: typeof parsed.currentStreak === 'number' ? parsed.currentStreak : 0,
        bestStreak: typeof parsed.bestStreak === 'number' ? parsed.bestStreak : 0,
        lastPlayedDate: typeof parsed.lastPlayedDate === 'string' ? parsed.lastPlayedDate : null,
      }
    }
  } catch {}
  return { currentStreak: 0, bestStreak: 0, lastPlayedDate: null }
}

function writeLocal(currentStreak, bestStreak, lastPlayedDate) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ currentStreak, bestStreak, lastPlayedDate }))
  } catch {}
}

export default function useStreak(user) {
  const [currentStreak, setCurrentStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [lastPlayedDate, setLastPlayedDate] = useState(null)

  useEffect(() => {
    async function init() {
      const local = readLocal()

      if (user) {
        const cloud = await loadStreakFromCloud(user.id)
        if (cloud) {
          // Take the higher values (cloud wins if it has more data)
          const merged = {
            currentStreak: Math.max(local.currentStreak, cloud.currentStreak),
            bestStreak: Math.max(local.bestStreak, cloud.bestStreak),
            lastPlayedDate: cloud.lastPlayedDate ?? local.lastPlayedDate,
          }
          setCurrentStreak(merged.currentStreak)
          setBestStreak(merged.bestStreak)
          setLastPlayedDate(merged.lastPlayedDate)
          writeLocal(merged.currentStreak, merged.bestStreak, merged.lastPlayedDate)
        } else {
          setCurrentStreak(local.currentStreak)
          setBestStreak(local.bestStreak)
          setLastPlayedDate(local.lastPlayedDate)
          // Push local data up to cloud
          if (local.currentStreak > 0 || local.bestStreak > 0) {
            syncStreakToCloud(user.id, local.currentStreak, local.bestStreak, local.lastPlayedDate)
          }
        }
      } else {
        setCurrentStreak(local.currentStreak)
        setBestStreak(local.bestStreak)
        setLastPlayedDate(local.lastPlayedDate)
      }
    }
    init()
  }, [user?.id])

  function recordWin() {
    const today = getTodayString()
    if (lastPlayedDate === today) return

    const yesterday = getYesterdayString()
    const nextCurrent = lastPlayedDate === yesterday ? currentStreak + 1 : 1
    const nextBest = nextCurrent > bestStreak ? nextCurrent : bestStreak

    setCurrentStreak(nextCurrent)
    setBestStreak(nextBest)
    setLastPlayedDate(today)
    writeLocal(nextCurrent, nextBest, today)
    if (user) syncStreakToCloud(user.id, nextCurrent, nextBest, today)
  }

  function recordLoss() {
    const today = getTodayString()
    if (lastPlayedDate === today) return

    setCurrentStreak(0)
    setLastPlayedDate(today)
    writeLocal(0, bestStreak, today)
    if (user) syncStreakToCloud(user.id, 0, bestStreak, today)
  }

  function getStreak() {
    return { currentStreak, bestStreak }
  }

  return { currentStreak, bestStreak, recordWin, recordLoss, getStreak }
}
