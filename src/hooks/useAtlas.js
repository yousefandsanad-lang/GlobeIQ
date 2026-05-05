import { useState, useEffect } from 'react'
import { createPlayerIfNotExists, syncAtlasToCloud, loadAtlasFromCloud } from '../utils/syncService'

const STORAGE_KEY = 'globeiq_atlas'

// Storage format: { userId: string | null, ids: string[] }
// userId null = guest (not signed in)
// Backward compat: old format was a plain array — treat as guest data
function readLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return { userId: null, ids: parsed } // old format
      if (parsed && Array.isArray(parsed.ids)) return parsed           // new format
    }
  } catch {}
  return { userId: null, ids: [] }
}

function writeLocal(userId, ids) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ userId, ids }))
  } catch {}
}

export default function useAtlas(user) {
  const [collectedCountries, setCollectedCountries] = useState([])

  useEffect(() => {
    async function init() {
      const local = readLocal()

      if (user) {
        await createPlayerIfNotExists(user.id)
        const cloud = await loadAtlasFromCloud(user.id)

        // Only merge local data if it belongs to this user or is anonymous guest data.
        // If it belongs to a different account, ignore it — use cloud only.
        const isOwnLocal = local.userId === null || local.userId === user.id
        const merged = [...new Set([...(isOwnLocal ? local.ids : []), ...cloud])]

        setCollectedCountries(merged)
        writeLocal(user.id, merged)
        if (merged.length > 0) syncAtlasToCloud(user.id, merged)
      } else {
        setCollectedCountries(local.ids)
      }
    }
    init()
  }, [user?.id])

  function addToAtlas(countryId) {
    setCollectedCountries(prev => {
      if (prev.includes(String(countryId))) return prev
      const next = [...prev, String(countryId)]
      writeLocal(user?.id ?? null, next)
      if (user) syncAtlasToCloud(user.id, next)
      return next
    })
  }

  function hasCountry(countryId) {
    return collectedCountries.includes(String(countryId))
  }

  function getAtlasCount() {
    return collectedCountries.length
  }

  return { collectedCountries, addToAtlas, hasCountry, getAtlasCount }
}
