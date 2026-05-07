import { useEffect, useRef, useState } from 'react'
import useGameLogic from './hooks/useGameLogic'
import useAtlas from './hooks/useAtlas'
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
import AtlasModal from './components/AtlasModal'
import { generateShareText } from './utils/shareCard'
import { playCorrect, playWrong, playReveal } from './utils/sound'
import countries from './data/countries'

const countryNames = countries.map(c => c.name)
countries.forEach(c => {
  if (c.aliases) countryNames.push(...c.aliases)
})

const isDevMode = import.meta.env.DEV && new URLSearchParams(window.location.search).has('dev')

function App() {
  const { user, signInWithGoogle, signInWithMagicLink, signOut } = useAuth()
  const { collectedCountries, addToAtlas } = useAtlas(user)

  const {
    currentCountry,
    guesses,
    guessCount,
    gameStatus,
    makeGuess,
    nextCountry,
  } = useGameLogic(collectedCountries)

  const { switchMode } = usePuzzleMode()

  const [revealDismissed, setRevealDismissed] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showAtlasModal, setShowAtlasModal] = useState(false)

  useEffect(() => {
    if (gameStatus === 'playing') setRevealDismissed(false)
  }, [gameStatus])

  const [showHowToPlay, setShowHowToPlay] = useState(() => {
    try { return localStorage.getItem('globeiq_visited') !== 'true' }
    catch { return true }
  })

  function closeHowToPlay() {
    setShowHowToPlay(false)
    try { localStorage.setItem('globeiq_visited', 'true') } catch {}
  }

  useEffect(() => {
    if (!currentCountry) return
    if (gameStatus === 'won') addToAtlas(currentCountry.id)
  }, [gameStatus, currentCountry])

  // Sound effects — skip firing on initial mount/restore
  const soundReadyRef = useRef(false)
  useEffect(() => {
    if (!soundReadyRef.current) { soundReadyRef.current = true; return }
    if (gameStatus === 'won') { playCorrect(); playReveal() }
    else if (gameStatus === 'lost') { playWrong() }
  }, [gameStatus])

  const prevGuessCountRef = useRef(null)
  useEffect(() => {
    if (prevGuessCountRef.current !== null && guessCount > prevGuessCountRef.current && gameStatus === 'playing') {
      playWrong()
    }
    prevGuessCountRef.current = guessCount
  }, [guessCount, gameStatus])

  function handleNext() {
    nextCountry()
    switchMode('daily')
  }

  function handleShare() {
    if (!currentCountry || gameStatus !== 'won') return
    const text = generateShareText(currentCountry, guesses, true)
    if (!text) return
    navigator.clipboard.writeText(text).then(() => alert('Copied to clipboard!'))
  }

  if (!currentCountry) {
    return (
      <div id="globeiq-app">
        <WorldMap collectedCountries={collectedCountries} currentCountryId={null} allCountries={countries} />
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

      {isDevMode && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99998,
          background: '#FF6B35', color: '#fff', fontSize: 12, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          padding: '6px 16px',
        }}>
          <span>🛠 DEV MODE</span>
          {currentCountry && <span>Country: {currentCountry.name}</span>}
          <button
            onClick={handleNext}
            style={{ background: '#fff', color: '#FF6B35', border: 'none', borderRadius: 6, padding: '2px 10px', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}
          >
            Next Country →
          </button>
        </div>
      )}

      <header id="globeiq-header" style={{ position: 'relative', overflow: 'visible', marginTop: isDevMode ? 36 : 0 }}>
        <h1>🌍 GlobeIQ</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="help-button" onClick={() => setShowHowToPlay(true)} aria-label="How to play">?</button>
          <div
            className="atlas-badge"
            onClick={() => setShowAtlasModal(true)}
            style={{ cursor: 'pointer' }}
          >🗺️ {collectedCountries.length}/195</div>
          {user ? (
            <button
              onClick={() => { if (window.confirm(`Signed in as ${user.email}\n\nSign out of GlobeIQ?`)) signOut() }}
              style={{ background: 'none', border: '1px solid #ffffff30', borderRadius: 20, padding: '6px 14px', fontSize: 13, color: '#ccc', cursor: 'pointer' }}
            >
              {user.email.slice(0, 12)}...
            </button>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              style={{ background: '#4A90D9', border: 'none', borderRadius: 20, padding: '6px 14px', fontSize: 13, color: '#fff', fontWeight: 600, cursor: 'pointer' }}
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      <main className="game-area">

        {/* Playing */}
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
              disabled={false}
              countries={countries}
              countryNames={countryNames}
              previousGuesses={guesses}
              puzzleKey={currentCountry?.id}
            />
          </>
        )}

        {/* Win or Loss — show reveal card */}
        {(gameStatus === 'won' || gameStatus === 'lost') && !revealDismissed && (
          <>
            <RevealCard
              country={currentCountry}
              won={gameStatus === 'won'}
              onNext={handleNext}
              onDismiss={() => setRevealDismissed(true)}
            />
            {gameStatus === 'won' && (
              <button className="share-button" onClick={handleShare}>
                📋 Share Result
              </button>
            )}
          </>
        )}

        {/* Dismissed — show pill + all hints */}
        {(gameStatus === 'won' || gameStatus === 'lost') && revealDismissed && (
          <>
            <button type="button" className="reveal-pill" onClick={() => setRevealDismissed(false)}>
              {gameStatus === 'won' ? '🎉 You got it! Tap to see result' : '😔 Tap to see card'}
            </button>
            <HintPanel guessCount={6} country={currentCountry} />
          </>
        )}

      </main>

      {showHowToPlay && <HowToPlay onClose={closeHowToPlay} />}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          signInWithGoogle={signInWithGoogle}
          signInWithMagicLink={signInWithMagicLink}
        />
      )}
      {showAtlasModal && (
        <AtlasModal
          collectedCountries={collectedCountries}
          allCountries={countries}
          onClose={() => setShowAtlasModal(false)}
        />
      )}
    </div>
  )
}

export default App
