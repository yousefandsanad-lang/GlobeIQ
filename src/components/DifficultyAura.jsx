const LABELS = { easy: 'Easy', medium: 'Medium', hard: 'Hard' }

export default function DifficultyAura({ difficulty }) {
  const key = LABELS[difficulty] ? difficulty : 'easy'

  return (
    <div className="difficulty-aura">
      <span className={`difficulty-pill ${key}`}>
        <span className="dot" aria-hidden="true" />
        {LABELS[key]}
      </span>
    </div>
  )
}
