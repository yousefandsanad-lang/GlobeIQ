// Build a spoiler-free, shareable result. We deliberately do NOT include the
// country name or flag — the emoji grid shows the journey (how many guesses)
// without giving the answer away, so a recipient is intrigued rather than
// spoiled, and the streak line adds a flex. Losses are shareable too (FOMO).

function isCorrectGuess(country, guess) {
  const q = String(guess).trim().toLowerCase()
  if (q === country.name.toLowerCase()) return true
  return country.aliases?.some(a => a.toLowerCase() === q) ?? false
}

function generateShareText(country, guesses, won, streak = 0) {
  if (!country || !Array.isArray(guesses)) return null

  // 🟩 = the correct guess, 🟥 = a miss. One square per guess made.
  const grid = won
    ? guesses.map(g => (isCorrectGuess(country, g) ? '🟩' : '🟥')).join('')
    : '🟥'.repeat(Math.max(guesses.length, 7))

  const lines = ['🌍 GlobeIQ']

  if (won) {
    lines.push(`${grid}  Solved in ${guesses.length}/7`)
    if (streak >= 2) lines.push(`🔥 ${streak}-win streak`)
    lines.push('Can you beat me? → globeiq.app')
  } else {
    lines.push(`${grid}  Stumped me! 😤`)
    lines.push('Think you can guess it? → globeiq.app')
  }

  return lines.join('\n')
}

export { generateShareText }
export default generateShareText
