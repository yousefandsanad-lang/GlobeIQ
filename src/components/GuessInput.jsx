import { useState, useRef, useEffect, useMemo } from 'react'

export default function GuessInput({ onGuess, disabled, countries, countryNames, previousGuesses, puzzleKey }) {
  const [value, setValue] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [dropdownDirection, setDropdownDirection] = useState('down')
  const [userInteracted, setUserInteracted] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [error, setError] = useState('')
  const [shaking, setShaking] = useState(false)
  const errorTimerRef = useRef(null)
  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const itemRefs = useRef([])

  useEffect(() => {
    setUserInteracted(false)
    setShowDropdown(false)
    setHighlightedIndex(-1)
  }, [puzzleKey])

  useEffect(() => {
    if (inputRef.current && !disabled) {
      const t = setTimeout(() => { inputRef.current?.focus() }, 500)
      return () => clearTimeout(t)
    }
  }, [puzzleKey])

  useEffect(() => () => clearTimeout(errorTimerRef.current), [])

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && itemRefs.current[highlightedIndex]) {
      itemRefs.current[highlightedIndex].scrollIntoView({ block: 'nearest' })
    }
  }, [highlightedIndex])

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

  function submit(nameOverride) {
    if (disabled) return
    const trimmed = (nameOverride ?? value).trim()
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
    setHighlightedIndex(-1)
    setError('')
    setShaking(false)
  }

  function handleKeyDown(e) {
    setUserInteracted(true)

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!showDropdown) setShowDropdown(true)
      setHighlightedIndex(prev =>
        prev < filteredCountries.length - 1 ? prev + 1 : 0
      )
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex(prev =>
        prev > 0 ? prev - 1 : filteredCountries.length - 1
      )
      return
    }

    if (e.key === 'Escape') {
      setShowDropdown(false)
      setHighlightedIndex(-1)
      return
    }

    if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && filteredCountries[highlightedIndex]) {
        const name = filteredCountries[highlightedIndex].name
        setValue(name)
        setShowDropdown(false)
        setHighlightedIndex(-1)
        submit(name)
      } else {
        submit()
      }
    }
  }

  function handleChange(e) {
    setUserInteracted(true)
    setValue(e.target.value)
    setHighlightedIndex(-1)
    setShowDropdown(true)
  }

  function handleSelect(name) {
    setValue(name)
    setShowDropdown(false)
    setHighlightedIndex(-1)
  }

  function computeDirection() {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    setDropdownDirection(spaceBelow < 300 && spaceAbove > spaceBelow ? 'up' : 'down')
  }

  const guessesLeft = Math.max(0, 7 - previousGuesses.length)
  const dropdownOpen = showDropdown && filteredCountries.length > 0

  return (
    <div ref={containerRef} className="guess-input-container" style={{ position: 'relative' }}>
      <div className="guess-counter">
        {guessesLeft} {guessesLeft === 1 ? 'guess' : 'guesses'} left
      </div>

      <input
        ref={inputRef}
        type="text"
        className={shaking ? 'input-shake' : ''}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onClick={() => { setUserInteracted(true); computeDirection(); setShowDropdown(true) }}
        onFocus={() => { if (!userInteracted) return; computeDirection(); setShowDropdown(true) }}
        onBlur={() => setTimeout(() => { setShowDropdown(false); setHighlightedIndex(-1) }, 150)}
        placeholder="Type a country name..."
        disabled={disabled}
        style={{
          borderRadius: dropdownOpen
            ? (dropdownDirection === 'up' ? '0 0 12px 12px' : '12px 12px 0 0')
            : undefined,
        }}
      />

      {error && (
        <div style={{ color: '#E74C3C', fontSize: 12, marginTop: 6 }}>
          {error}
        </div>
      )}

      {dropdownOpen && (
        <ul
          style={{
            position: 'absolute',
            top: dropdownDirection === 'down' ? '100%' : 'auto',
            bottom: dropdownDirection === 'up' ? '100%' : 'auto',
            left: 0,
            width: '100%',
            background: 'rgba(10, 14, 26, 0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: dropdownDirection === 'up' ? '12px 12px 0 0' : '0 0 12px 12px',
            maxHeight: 250,
            overflowY: 'auto',
            zIndex: 200,
            margin: 0,
            padding: 0,
            listStyle: 'none',
          }}
        >
          {filteredCountries.map((c, idx) => (
            <li
              key={c.id}
              ref={el => (itemRefs.current[idx] = el)}
              onMouseDown={() => handleSelect(c.name)}
              style={{
                padding: '12px 16px',
                fontSize: 15,
                cursor: 'pointer',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                color: 'white',
                background: idx === highlightedIndex ? '#ffffff20' : 'transparent',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = idx === highlightedIndex ? '#ffffff20' : 'rgba(255,255,255,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = idx === highlightedIndex ? '#ffffff20' : 'transparent')}
            >
              <span>{c.name}</span>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={() => submit()}
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
