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
        style={{
          background: won
            ? `linear-gradient(150deg, ${theme.primary} 0%, ${theme.background} 135%)`
            : 'linear-gradient(150deg, #2a3a4a 0%, #141c28 130%)',
        }}
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
        <div className="reveal-eyebrow">
          {won ? '🎉 Correct!' : '😔 Not this time'}
        </div>
        {won
          ? <h2>{country.name}</h2>
          : <h2 style={{ opacity: 0.4, letterSpacing: 4, fontSize: 22 }}>? ? ?</h2>
        }
        {won && <div className="reveal-flag">{country.flagEmoji}</div>}
      </div>

      <div className="facts-grid">
        <div className="fact-cell">
          <label>Capital</label>
          <span>{won ? country.capital || '—' : '???'}</span>
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

      <div className="fun-fact" style={won ? {} : { opacity: 0.4, fontStyle: 'italic' }}>
        <span className="fun-fact-label">Did you know?</span>
        {won ? country.funFact : 'Guess correctly to unlock this country\'s fun fact!'}
      </div>

      <button
        className="next-button"
        onClick={onNext}
        style={{ background: won ? `linear-gradient(135deg, ${theme.primary}, ${theme.background})` : 'linear-gradient(135deg, #4DA3FF, #6366F1)' }}
      >
        {won ? 'Next Country →' : 'Try Another Country →'}
      </button>

      {showScrollHint && (
        <div className="scroll-hint">scroll for more ↓</div>
      )}
    </div>
  )
}
