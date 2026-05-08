import { useEffect, useState } from 'react'

const CONFETTI_COLORS = [
  '#FFD700', '#FF6B6B', '#4A90D9', '#50C878', '#FF69B4',
  '#9B59B6', '#FF8C00', '#00CED1', '#FF4500', '#32CD32',
]

function generateConfetti(count = 60) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 3}s`,
    duration: `${3 + Math.random() * 3}s`,
    size: `${6 + Math.random() * 8}px`,
    rotation: `${Math.random() * 360}deg`,
    drift: `${(Math.random() - 0.5) * 120}px`,
  }))
}

export default function AtlasComplete({ onContinue }) {
  const [confetti] = useState(() => generateConfetti(60))
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Slight delay so the animation feels intentional
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className={`atlas-complete-overlay ${visible ? 'visible' : ''}`}>
      {/* Confetti */}
      <div className="confetti-container" aria-hidden="true">
        {confetti.map(p => (
          <div
            key={p.id}
            className="confetti-piece"
            style={{
              left: p.left,
              width: p.size,
              height: p.size,
              background: p.color,
              animationDelay: p.delay,
              animationDuration: p.duration,
              '--drift': p.drift,
              '--rot': p.rotation,
            }}
          />
        ))}
      </div>

      {/* Card */}
      <div className="atlas-complete-card">
        <div className="atlas-complete-globe">🌍</div>

        <h1 className="atlas-complete-title">Atlas Complete!</h1>

        <p className="atlas-complete-subtitle">
          You've discovered all <strong>195 countries</strong>.
        </p>

        <p className="atlas-complete-message">
          You're officially a GlobeIQ Explorer — one of the rare few to map the entire world.
          Every country, every continent, every corner of the globe. 🧭
        </p>

        <div className="atlas-complete-stats">
          <div className="atlas-complete-stat">
            <span className="atlas-complete-stat-value">195</span>
            <span className="atlas-complete-stat-label">Countries collected</span>
          </div>
          <div className="atlas-complete-stat">
            <span className="atlas-complete-stat-value">7</span>
            <span className="atlas-complete-stat-label">Continents explored</span>
          </div>
        </div>

        <button className="atlas-complete-button" onClick={onContinue}>
          Keep Exploring 🌐
        </button>

        <p className="atlas-complete-footer">
          Your atlas is full — keep playing to test your knowledge!
        </p>
      </div>
    </div>
  )
}
