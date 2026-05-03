const styles = {
  easy:   { background: '#1a3a1a', border: '1px solid #2ECC71', color: '#2ECC71', label: '● Easy' },
  medium: { background: '#3a2a00', border: '1px solid #F39C12', color: '#F39C12', label: '● Medium' },
  hard:   { background: '#3a0000', border: '1px solid #E74C3C', color: '#E74C3C', label: '● Hard' },
}

export default function DifficultyAura({ difficulty }) {
  const s = styles[difficulty] ?? styles.easy

  return (
    <div className="difficulty-aura">
      <span
        style={{
          display: 'inline-block',
          padding: '4px 12px',
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.5px',
          background: s.background,
          border: s.border,
          color: s.color,
        }}
      >
        {s.label}
      </span>
    </div>
  )
}
