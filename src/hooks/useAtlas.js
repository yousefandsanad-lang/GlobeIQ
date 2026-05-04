import { useState, useEffect } from 'react'
import { createPlayerIfNotExists, syncAtlasToCloud, loadAtlasFromCloud } from '../utils/syncService'

const STORAGE_KEY = 'globeiq_atlas'

function readLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {}
  return []
}

function writeLocal(ids) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
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
        const merged = [...new Set([...local, ...cloud])]
        setCollectedCountries(merged)
        writeLocal(merged)
        if (merged.length > 0) syncAtlasToCloud(user.id, merged)
      } else {
        setCollectedCountries(local)
      }
    }
    init()
  }, [user?.id])

  function addToAtlas(countryId) {
    setCollectedCountries(prev => {
      if (prev.includes(String(countryId))) return prev
      const next = [...prev, String(countryId)]
      writeLocal(next)
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
