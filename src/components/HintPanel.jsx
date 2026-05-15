import { useEffect, useRef } from 'react'
import { trackEvent } from '../utils/analytics'

const hints = country => [
  { icon: '🌡️', label: 'Climate & Terrain', value: country.climate },
  { icon: '🗺️', label: 'Borders',           value: country.borders === 0 ? 'Island — no land borders' : `${country.borders} land border${country.borders === 1 ? '' : 's'}` },
  { icon: '📍', label: 'Region',            value: country.region },
  { icon: '🏆', label: 'Known For',         value: country.knownFor, valueStyle: { fontSize: '13px', fontWeight: 'bold', color: 'white' } },
  { icon: '🏙️', label: 'Capital',           value: country.capital },
  { icon: '🚩', label: 'Flag',              value: country.flagEmoji, valueStyle: { fontSize: '32px' } },
]

export default function HintPanel({ guessCount, country }) {
  const visible = hints(country).slice(0, guessCount)

  const prevCountRef = useRef(null)
  useEffect(() => {
    // Skip the initial mount / restore — only fire on real reveals during this session.
    if (prevCountRef.current !== null && guessCount > prevCountRef.current && guessCount <= 6) {
      trackEvent('hint_reveal', {
        hint_number: guessCount,
        country: country?.name,
      })
    }
    prevCountRef.current = guessCount
  }, [guessCount, country?.name])

  return (
    <div className="hint-panel">
      {visible.map((h, i) => (
        <div key={i} className="hint-row">
          <span className="hint-label">
            Hint {i + 1} · {h.icon} {h.label}
          </span>
          <span className="hint-colon">:</span>
          <span className="hint-value" style={h.valueStyle}> {h.value}</span>
        </div>
      ))}
    </div>
  )
}
