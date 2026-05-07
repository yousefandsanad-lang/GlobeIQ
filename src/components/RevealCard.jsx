import { useEffect, useRef, useState } from 'react'
import { getContinentTheme } from '../utils/continentTheme'

export default function RevealCard({ country, won, onNext, onDismiss }) {
  const theme = getContinentTheme(country.continent)
  const cardRef = useRef(null)
  const [showScrollHint, setShowScrollHint] = useState(false)

  useEffect(() => {
    const overflows = document.documentElement.scrollHeight > window.innerHeight + 4
    if (overflows) {
      setShowScrollHint(true)
      const t = setTimeout(() => setShowScrollHint(false), 2200)
      return () => clearTimeout(t)
    }
  }, [country.id])

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

      <button
        className="next-button"
        onClick={onNext}
        style={{ background: theme.primary }}
      >
        Next Country →
      </button>

      {showScrollHint && (
        <div className="scroll-hint">scroll for more ↓</div>
      )}
    </div>
  )
}
