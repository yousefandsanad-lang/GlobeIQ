import { useMemo } from 'react'

const COLORS = ['#4DA3FF', '#6366F1', '#A855F7', '#38BDF8', '#34D399', '#FBBF24']

// A lightweight, one-shot confetti burst for the win moment. Pieces are
// memoised so they don't regenerate on re-render, and the CSS animation
// runs once (forwards) then settles invisibly. Respects reduced-motion via
// the global media query in main.css.
export default function Confetti({ count = 46 }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: Math.random() * 100,
        size: 6 + Math.random() * 7,
        duration: 2.4 + Math.random() * 1.8,
        delay: Math.random() * 0.25,
        drift: (Math.random() * 2 - 1) * 130,
        rot: 0.5 + Math.random() * 1.6,
        color: COLORS[i % COLORS.length],
        round: Math.random() > 0.5,
      })),
    [count],
  )

  return (
    <div className="confetti-container" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * (p.round ? 1 : 1.7),
            background: p.color,
            borderRadius: p.round ? '50%' : '2px',
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            '--drift': `${p.drift}px`,
            '--rot': p.rot,
          }}
        />
      ))}
    </div>
  )
}
