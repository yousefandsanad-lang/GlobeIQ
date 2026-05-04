import { useEffect, useRef, useState } from 'react'
import useGameLogic from './hooks/useGameLogic'
import useAtlas from './hooks/useAtlas'
import useStreak from './hooks/useStreak'
import usePuzzleMode from './hooks/usePuzzleMode'
import useAuth from './hooks/useAuth'
import Silhouette from './components/Silhouette'
import DifficultyAura from './components/DifficultyAura'
import HintPanel from './components/HintPanel'
import GuessInput from './components/GuessInput'
import RevealCard from './components/RevealCard'
import WorldMap from './components/WorldMap'
import HowToPlay from './components/HowToPlay'
import AuthModal from './components/AuthModal'
import { generateShareText } from './utils/shareCard'
import { playCorrect, playWrong, playReveal, playStreak } from './utils/sound'
import countries from './data/countries'


const countryNames = countries.map(c => c.name)
countries.forEach(c => {
  if (c.aliases) countryNames.push(...c.aliases)
})

function App() {
  const { user, signInWithGoogle, signInWithMagicLink, signOut } = useAuth()
  const { collectedCountries, addToAtlas } = useAtlas(user)

  const {
    currentCountry,
    guesses,
    guessCount,
    gameStatus,
    makeGuess,
    resetGame,
  } = useGameLogic(collectedCountries)
  const { currentStreak, bestStreak, recordWin, recordLoss } = useStreak(user)
  const { switchMode } = usePuzzleMode()

  const [revealDismissed, setRevealDismissed] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    if (gameStatus === 'playing') setRevealDismissed(false)
  }, [gameStatus])

  const [showHowToPlay, setShowHowToPlay] = useState(() => {
    try {
      return localStorage.getItem('globeiq_visited') !== 'true'
    } catch {
      return true
    }
  })

  function closeHowToPlay() {
    setShowHowToPlay(false)
    try {
      localStorage.setItem('globeiq_visited', 'true')
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (!currentCountry) return
    if (gameStatus === 'won') {
      addToAtlas(currentCountry.id)
      recordWin()
    } else if (gameStatus === 'lost') {
      recordLoss()
    }
  }, [gameStatus, currentCountry])

  // Sound effects — skip firing on initial mount/restore
  const soundReadyRef = useRef(false)
  useEffect(() => {
    if (!soundReadyRef.current) { soundReadyRef.current = true; return }
    if (gameStatus === 'won') {
      playCorrect()
      playReveal()
      if (currentStreak >= 1) playStreak()
    } else if (gameStatus === 'lost') {
      playWrong()
    }
  }, [gameStatus])

  const prevGuessCountRef = useRef(null)
  useEffect(() => {
    if (prevGuessCountRef.current !== null && guessCount > prevGuessCountRef.current && gameStatus === 'playing') {
      playWrong()
    }
    prevGuessCountRef.current = guessCount
  }, [guessCount, gameStatus])

  function handleShare() {
    if (!currentCountry) return
    const text = generateShareText(
      currentCountry,
      guesses,
      gameStatus === 'won',
      currentCountry.id,
    )
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!')
    })
  }

  function handleNext() {
    resetGame()
    switchMode('daily')
  }

  if (!currentCountry) {
    return (
      <div id="globeiq-app">
        <WorldMap
          collectedCountries={collectedCountries}
          currentCountryId={currentCountry?.id}
          allCountries={countries}
        />
        Loading…
      </div>
    )
  }

  return (
    <div id="globeiq-app">
      <WorldMap
        collectedCountries={collectedCountries}
        currentCountryId={currentCountry?.id}
        allCountries={countries}
      />

      <header id="globeiq-header" style={{ position: 'relative', overflow: 'visible' }}>
        <h1>🌍 GlobeIQ</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            className="help-button"
            onClick={() => setShowHowToPlay(true)}
            aria-label="How to play"
          >
            ?
          </button>
          <div className="streak-badge">🔥 {currentStreak}</div>
          <div className="atlas-badge">🗺️ {collectedCountries.length}/195</div>
          {user ? (
            <button
              onClick={() => {
                if (window.confirm(`Signed in as ${user.email}\n\nSign out of GlobeIQ?`)) signOut()
              }}
              style={{
                background: 'none',
                border: '1px solid #ffffff30',
                borderRadius: 20,
                padding: '6px 14px',
                fontSize: 13,
                color: '#ccc',
                cursor: 'pointer',
              }}
            >
              {user.email.slice(0, 12)}...
            </button>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              style={{
                background: '#4A90D9',
                border: 'none',
                borderRadius: 20,
                padding: '6px 14px',
                fontSize: 13,
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      <main className="game-area">
        {gameStatus === 'playing' && (
          <>
            <DifficultyAura difficulty={currentCountry.difficulty} />
            <Silhouette
              continent={currentCountry.continent}
              revealed={false}
              countryName={currentCountry.name}
              countryId={currentCountry.id}
              flagEmoji={currentCountry.flagEmoji}
            />
            <HintPanel guessCount={guessCount} country={currentCountry} />
            <GuessInput
              onGuess={makeGuess}
              disabled={gameStatus !== 'playing'}
              countries={countries}
              countryNames={countryNames}
              previousGuesses={guesses}
              puzzleKey={currentCountry?.id}
            />
          </>
        )}

        {(gameStatus === 'won' || gameStatus === 'lost') && !revealDismissed && (
          <>
            <RevealCard
              country={currentCountry}
              won={gameStatus === 'won'}
              onNext={handleNext}
              onDismiss={() => setRevealDismissed(true)}
            />
            <button className="share-button" onClick={handleShare}>
              📋 Share Result
            </button>
          </>
        )}

        {(gameStatus === 'won' || gameStatus === 'lost') && revealDismissed && (
          <button
            type="button"
            className="reveal-pill"
            onClick={() => setRevealDismissed(false)}
          >
            {gameStatus === 'won'
              ? '🎉 You got it! Tap to see result'
              : 'See result →'}
          </button>
        )}

      </main>

      {showHowToPlay && (
        <HowToPlay onClose={closeHowToPlay} />
      )}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          signInWithGoogle={signInWithGoogle}
          signInWithMagicLink={signInWithMagicLink}
        />
      )}
    </div>
  )
}

export default App
