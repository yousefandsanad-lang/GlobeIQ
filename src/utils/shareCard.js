const LAUNCH_DATE = new Date('2026-05-04')

function puzzleDay() {
  const today = new Date()
  const diff = Math.floor((today - LAUNCH_DATE) / 86400000)
  return diff + 1
}

function generateShareText(country, guesses, won) {
  const MAX = 7
  const squares = []
  for (let i = 0; i < MAX; i++) {
    if (i < guesses.length) {
      const isCorrect = guesses[i].trim().toLowerCase() === country.name.toLowerCase()
      squares.push(isCorrect ? '🟢' : '🔴')
    } else {
      squares.push('⬜')
    }
  }

  const header = `🌍 GlobeIQ — Day ${puzzleDay()}`
  const row = squares.join(' ')
  const result = won
    ? `Got it in ${guesses.length} hint${guesses.length === 1 ? '' : 's'}! 🎉`
    : `Couldn't crack today's puzzle 🌍`

  return [header, row, result, '', 'Play today\'s puzzle 👇', 'https://globeiq.app'].join('\n')
}

export { generateShareText }
export default generateShareText
