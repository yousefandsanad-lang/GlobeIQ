function generateShareText(country, guesses, won) {
  if (!won) return null  // no share for losses

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

  const header = `🌍 GlobeIQ`
  const result = `${country.flagEmoji} ${country.name} — got it in ${guesses.length} hint${guesses.length === 1 ? '' : 's'}!`
  const row = squares.join(' ')

  return [header, result, row, '', 'Play at globeiq.app'].join('\n')
}

export { generateShareText }
export default generateShareText
