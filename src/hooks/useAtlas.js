import { useState, useEffect } from 'react'

const STORAGE_KEY = 'globeiq_atlas'

export default function useAtlas() {
  const [collectedCountries, setCollectedCountries] = useState([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          setCollectedCountries(parsed)
        }
      }
    } catch {
      // ignore — leave default empty array
    }
  }, [])

  function addToAtlas(countryId) {
    setCollectedCountries(prev => {
      if (prev.includes(countryId)) return prev
      const next = [...prev, countryId]
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // ignore quota / unavailable storage
      }
      return next
    })
  }

  function hasCountry(countryId) {
    return collectedCountries.includes(countryId)
  }

  function getAtlasCount() {
    return collectedCountries.length
  }

  return { collectedCountries, addToAtlas, hasCountry, getAtlasCount }
}
