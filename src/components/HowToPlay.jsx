const hintRows = [
  { n: 1, icon: '🌍', text: 'Continent' },
  { n: 2, icon: '🌡️', text: 'Climate & Terrain' },
  { n: 3, icon: '🗺️', text: 'Borders' },
  { n: 4, icon: '🏆', text: 'Known For' },
  { n: 5, icon: '🚩', text: 'Flag' },
  { n: 6, icon: '🏙️', text: 'Capital City' },
]

const sectionLabel = {
  fontSize: 11,
  color: '#888',
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontWeight: 600,
  marginBottom: 8,
}

const hintRowStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  background: '#ffffff08',
  borderRadius: 8,
  padding: '8px 12px',
  marginBottom: 6,
  fontSize: 13,
}

export default function HowToPlay({ onClose }) {
  return (
    <div
      onClick={onClose}
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
          padding: 28,
          maxWidth: 400,
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>
          🌍 How to Play
        </div>
        <div style={{ fontSize: 14, color: '#888', marginTop: 6, marginBottom: 20 }}>
          Guess the mystery country in 7 tries
        </div>

        <div style={{ marginBottom: 20 }}>
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

        <div style={{ marginBottom: 20 }}>
          <div style={sectionLabel}>Share your result</div>
          <pre
            style={{
              margin: 0,
              padding: '12px 14px',
              background: '#05080F',
              border: '1px solid #ffffff10',
              borderRadius: 10,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: 12,
              color: '#ddd',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
            }}
          >
{`🌍 GlobeIQ #1
🔴 🟢 ⬜ ⬜ ⬜ ⬜
Guessed in 2 hints!`}
          </pre>
        </div>

        <div style={{ color: '#aaa', fontSize: 13, marginBottom: 8 }}>
          🔥 Build your streak by playing daily
        </div>
        <div style={{ color: '#aaa', fontSize: 13, marginBottom: 24 }}>
          Collect all 195 countries in your atlas
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            background: '#4A90D9',
            border: 'none',
            borderRadius: 12,
            padding: 14,
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
