import { useEffect, useRef, useState } from 'react'
import { getContinentTheme } from '../utils/continentTheme'

function useCountdown() {
  const [time, setTime] = useState('')
  useEffect(() => {
    function tick() {
      const now = new Date()
      const midnight = new Date(now)
      midnight.setHours(24, 0, 0, 0)
      const diff = midnight - now
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTime(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return time
}

export default function RevealCard({ country, won, onDismiss }) {
  const theme = getContinentTheme(country.continent)
  const cardRef = useRef(null)
  const [showScrollHint, setShowScrollHint] = useState(false)

  useEffect(() => {
    const overflows =
      document.documentElement.scrollHeight > window.innerHeight + 4
    if (overflows) {
      setShowScrollHint(true)
      const t = setTimeout(() => setShowScrollHint(false), 2200)
      return () => clearTimeout(t)
    }
  }, [country.id])

  const countdown = useCountdown()

  return (
    <div className="reveal-card" ref={cardRef}>
      <div
        className="reveal-header"
        style={{ background: won ? theme.primary : '#2a2a2a' }}
      >
        {onDismiss && (
          <button
            type="button"
            className="review-hints-button"
            onClick={onDismiss}
            aria-label="Review hints"
          >
            ✕ Review hints
          </button>
        )}
        <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.9 }}>
          {won ? '🎉 Correct!' : '😔 Not this time'}
        </div>
        <h2>{country.name}</h2>
      </div>

      <div className="facts-grid">
        <div className="fact-cell">
          <label>Capital</label>
          <span>{country.capital || '—'}</span>
        </div>
        <div className="fact-cell">
          <label>Population</label>
          <span>{country.population || '—'}</span>
        </div>
        <div className="fact-cell">
          <label>Climate</label>
          <span>{country.climate || '—'}</span>
        </div>
        <div className="fact-cell">
          <label>Continent</label>
          <span>{country.continent || '—'}</span>
        </div>
      </div>

      <div className="personality-tags">
        {country.personalityTags.map(tag => (
          <span key={tag} className="tag-chip">{tag}</span>
        ))}
      </div>

      <div className="fun-fact">
        <span className="fun-fact-label">Did you know?</span>
        {country.funFact}
      </div>

      <div style={{
        textAlign: 'center',
        padding: '16px 0 4px',
      }}>
        <div style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>
          Next puzzle in
        </div>
        <div style={{
          fontVariantNumeric: 'tabular-nums',
          fontSize: 28,
          fontWeight: 800,
          color: theme.primary,
          letterSpacing: 2,
        }}>
          {countdown}
        </div>
        <div style={{ color: '#555', fontSize: 11, marginTop: 6 }}>
          Come back tomorrow for a new country 🌍
        </div>
      </div>

      {showScrollHint && (
        <div className="scroll-hint">scroll for more ↓</div>
      )}
    </div>
  )
}
