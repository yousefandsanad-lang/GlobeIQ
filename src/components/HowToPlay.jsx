import { useEffect } from 'react'

const hintRows = [
  { n: 1, icon: '🌡️', text: 'Climate & Terrain' },
  { n: 2, icon: '🗺️', text: 'Borders' },
  { n: 3, icon: '📍', text: 'Region' },
  { n: 4, icon: '🏆', text: 'Known For' },
  { n: 5, icon: '🏙️', text: 'Capital City' },
  { n: 6, icon: '🚩', text: 'Flag' },
]

const sectionLabel = {
  fontSize: 10,
  color: '#888',
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontWeight: 600,
  marginBottom: 5,
}

const hintRowStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  background: '#ffffff08',
  borderRadius: 8,
  padding: '6px 10px',
  marginBottom: 4,
  fontSize: 12,
}

export default function HowToPlay({ onClose }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="How to play"
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000000CC',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0F1420',
          border: '1px solid #ffffff20',
          borderRadius: 20,
          padding: 16,
          maxWidth: 400,
          width: '90%',
          maxHeight: '85vh',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>
          🌍 How to Play
        </div>
        <div style={{ fontSize: 12, color: '#888', marginTop: 4, marginBottom: 12 }}>
          Guess the mystery country in 7 tries or less
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={sectionLabel}>Hints revealed each guess</div>
          {hintRows.map(h => (
            <div key={h.n} style={hintRowStyle}>
              <span style={{ color: '#aaa' }}>Guess {h.n}</span>
              <span style={{ color: '#fff', fontWeight: 600 }}>
                {h.icon} {h.text}
              </span>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={sectionLabel}>Share your result</div>
          <div style={{ color: '#888', fontSize: 13 }}>
            📋 Share your result after each game
          </div>
        </div>

        <div style={{ color: '#aaa', fontSize: 13, marginBottom: 5 }}>
          🔥 Build your streak by playing daily
        </div>
        <div style={{ color: '#aaa', fontSize: 13, marginBottom: 14 }}>
          Collect all 195 countries in your atlas
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            background: '#4A90D9',
            border: 'none',
            borderRadius: 12,
            padding: 10,
            color: '#fff',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Got it, let's play! 🌍
        </button>
      </div>
    </div>
  )
}
