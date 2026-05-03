function generateShareText(country, guesses, won, puzzleNumber) {
  const squares = []
  for (let i = 0; i < 6; i++) {
    if (i < guesses.length) {
      const isCorrect = guesses[i].trim().toLowerCase() === country.name.toLowerCase()
      squares.push(isCorrect ? '🟢' : '🔴')
    } else {
      squares.push('⬜')
    }
  }

  const header = `🌍 GlobeIQ #${puzzleNumber}`
  const row = squares.join(' ')

  const result = won
    ? `Guessed in ${guesses.length} hint${guesses.length === 1 ? '' : 's'}!`
    : `The country was ${country.name}`

  const factWords = country.funFact.split(/\s+/).slice(0, 8).join(' ')
  const factLine = `${factWords}...`

  return [header, row, result, factLine, '', 'Play at globeiq.com'].join('\n')
}

export { generateShareText }
export default generateShareText
