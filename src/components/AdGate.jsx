import { useState, useEffect } from 'react'

export default function AdGate({ onUnlock, onClose, bonusPlaysToday, FREE_BONUS_LIMIT }) {
  const [watching, setWatching] = useState(false)
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!watching) return
    const start = Date.now()
    const duration = 3000
    let raf
    const frame = () => {
      const pct = Math.min((Date.now() - start) / duration, 1)
      setProgress(pct)
      if (pct < 1) {
        raf = requestAnimationFrame(frame)
      } else {
        setDone(true)
      }
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [watching])

  const remaining = FREE_BONUS_LIMIT - bonusPlaysToday

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(0,0,0,0.78)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        background: '#0F1525',
        border: '1px solid #ffffff18',
        borderRadius: 20,
        padding: '32px 28px',
        maxWidth: 360,
        width: '100%',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🎬</div>
        <div style={{ fontWeight: 800, fontSize: 18, color: '#fff', marginBottom: 8 }}>
          Bonus Puzzle
        </div>
        <div style={{ color: '#aaa', fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
          Watch a short ad to unlock a bonus puzzle
        </div>

        {watching && !done && (
          <div style={{ marginBottom: 20 }}>
            <div style={{
              height: 6, background: '#ffffff15',
              borderRadius: 99, overflow: 'hidden', marginBottom: 8,
            }}>
              <div style={{
                height: '100%',
                width: `${progress * 100}%`,
                background: '#4A90D9',
                borderRadius: 99,
              }} />
            </div>
            <div style={{ color: '#555', fontSize: 12 }}>Loading ad…</div>
          </div>
        )}

        {done && (
          <div style={{ color: '#4CAF50', fontSize: 14, fontWeight: 600, marginBottom: 20 }}>
            ✓ Ad complete!
          </div>
        )}

        <button
          onClick={done ? onUnlock : () => setWatching(true)}
          disabled={watching && !done}
          style={{
            width: '100%',
            padding: '13px 0',
            background: done ? '#4CAF50' : watching ? '#1e2535' : '#4A90D9',
            color: done || !watching ? '#fff' : '#555',
            border: 'none',
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 15,
            cursor: watching && !done ? 'default' : 'pointer',
            marginBottom: 16,
            transition: 'background 0.2s',
          }}
        >
          {done ? 'Play Bonus Puzzle →' : watching ? 'Watching…' : '▶ Watch Ad'}
        </button>

        <div style={{
          background: '#ffffff08',
          borderRadius: 10,
          padding: '10px 14px',
          marginBottom: 16,
          fontSize: 13,
          color: '#888',
          lineHeight: 1.6,
        }}>
          You get <strong style={{ color: '#fff' }}>{FREE_BONUS_LIMIT} free bonus puzzles</strong> per day
          <br />
          <span style={{ color: bonusPlaysToday > 0 ? '#E74C3C' : '#666' }}>
            {bonusPlaysToday} of {FREE_BONUS_LIMIT} used today &nbsp;·&nbsp; {remaining} remaining
          </span>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', color: '#444',
            fontSize: 13, cursor: 'pointer', padding: 4,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
