function getMotivation(collected) {
  if (collected === 195) return 'World Explorer! 🌟'
  if (collected < 50) return 'Keep exploring! 🌱'
  if (collected < 100) return 'Halfway there! 🌍'
  return 'Almost complete! 🏆'
}

export default function StreakMap({
  collectedCountries,
  totalCountries = 195,
  currentStreak,
  bestStreak,
}) {
  const collected = collectedCountries.length
  const percent = Math.min(100, (collected / totalCountries) * 100)

  return (
    <div className="streak-map">
      <div className="streak-number">🔥 {currentStreak} day streak</div>
      <div className="best-streak">Best: {bestStreak} days</div>

      <div className="atlas-label">
        {collected} / {totalCountries} countries discovered
      </div>
      <div className="progress-bar-bg">
        <div
          className="progress-bar-fill"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="motivation">{getMotivation(collected)}</div>
    </div>
  )
}
