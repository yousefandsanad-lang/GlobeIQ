import { useState, useRef, useEffect, useMemo } from 'react'

export default function GuessInput({ onGuess, disabled, countries, countryNames, previousGuesses }) {
  const [value, setValue] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [error, setError] = useState('')
  const [shaking, setShaking] = useState(false)
  const errorTimerRef = useRef(null)

  useEffect(() => () => clearTimeout(errorTimerRef.current), [])

  const sortedCountries = useMemo(
    () => [...countries].sort((a, b) => a.name.localeCompare(b.name)),
    [countries],
  )

  const filteredCountries = value.trim().length > 0
    ? sortedCountries.filter(c => {
        const q = value.trim().toLowerCase()
        return (
          c.name.toLowerCase().includes(q) ||
          (c.aliases?.some(a => a.toLowerCase().includes(q)) ?? false)
        )
      })
    : sortedCountries

  function isValidCountry(trimmed) {
    console.log('countryNames length:', countryNames?.length)
    const q = trimmed.toLowerCase()
    return countryNames.some(name => name.toLowerCase() === q)
  }

  function showError(msg) {
    setError(msg)
    setShaking(true)
    clearTimeout(errorTimerRef.current)
    errorTimerRef.current = setTimeout(() => {
      setError('')
      setShaking(false)
    }, 2000)
  }

  function isDuplicate(trimmed) {
    const q = trimmed.toLowerCase()
    return previousGuesses.some(g => g.toLowerCase() === q)
  }

  function submit() {
    if (disabled) return
    const trimmed = value.trim()
    if (!trimmed) {
      showError('⚠️ Please type a country name first')
      return
    }
    if (!isValidCountry(trimmed)) {
      showError('⚠️ Please select a valid country name')
      return
    }
    if (isDuplicate(trimmed)) {
      showError('⚠️ Already guessed that country')
      return
    }
    const result = onGuess(trimmed)
    if (result === 'already_collected') {
      showError('⚠️ You already collected this country!')
      return
    }
    setValue('')
    setShowDropdown(false)
    setError('')
    setShaking(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') submit()
  }

  function handleChange(e) {
    setValue(e.target.value)
    setShowDropdown(true)
  }

  function handleSelect(name) {
    setValue(name)
    setShowDropdown(false)
  }

  const guessesLeft = Math.max(0, 7 - previousGuesses.length)
  const dropdownOpen = showDropdown && filteredCountries.length > 0

  return (
    <div className="guess-input-container" style={{ position: 'relative' }}>
      <div className="guess-counter">
        {guessesLeft} {guessesLeft === 1 ? 'guess' : 'guesses'} left
      </div>

      <input
        type="text"
        className={shaking ? 'input-shake' : ''}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
        placeholder="Type a country name..."
        disabled={disabled}
        style={{
          borderRadius: dropdownOpen ? '12px 12px 0 0' : undefined,
        }}
      />

      {error && (
        <div
          style={{
            color: '#E74C3C',
            fontSize: 12,
            marginTop: 6,
          }}
        >
          {error}
        </div>
      )}

      {dropdownOpen && (
        <ul
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            width: '100%',
            background: '#1a1a2e',
            border: '1px solid #ffffff20',
            borderRadius: '0 0 12px 12px',
            maxHeight: 280,
            overflowY: 'auto',
            zIndex: 200,
            margin: 0,
            padding: 0,
            listStyle: 'none',
          }}
        >
          {filteredCountries.map(c => (
            <li
              key={c.id}
              onMouseDown={() => handleSelect(c.name)}
              style={{
                padding: '12px 16px',
                fontSize: 15,
                cursor: 'pointer',
                borderBottom: '1px solid #ffffff08',
                color: 'white',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#ffffff12')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span>{c.name}</span>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={submit}
        disabled={disabled || !value.trim()}
      >
        Guess
      </button>

      {previousGuesses.length > 0 && (
        <div className="wrong-guesses">
          {[...new Set(previousGuesses)].map(guess => (
            <span key={guess} className="wrong-chip">
              {guess}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
