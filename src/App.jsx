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
import AtlasModal from './components/AtlasModal'
import AdGate from './components/AdGate'
import { generateShareText } from './utils/shareCard'
import { playCorrect, playWrong, playReveal, playStreak } from './utils/sound'
import countries from './data/countries'


function useCountdown() {
  const [time, setTime] = useState('')
  useEffect(() => {
    function tick() {
      const now = new Date()
      const midnight = new Date(now)
      midnight.setHours(24, 0, 0, 0)
      const diff = midnight - now
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTime(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return time
}

function AlreadyPlayedToday({ country }) {
  const countdown = useCountdown()
  return (
    <div style={{ textAlign: 'center', padding: '32px 16px' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{country.flagEmoji}</div>
      <div style={{ color: '#fff', fontWeight: 700, fontSize: 18, marginBottom: 6 }}>
        You already have {country.name}!
      </div>
      <div style={{ color: '#888', fontSize: 13, marginBottom: 16 }}>
        You collected this country in your atlas.
      </div>
      <div style={{
        background: '#ffffff08',
        border: '1px solid #ffffff12',
        borderRadius: 12,
        padding: '12px 16px',
        marginBottom: 24,
        maxWidth: 320,
        margin: '0 auto 24px',
        textAlign: 'left',
      }}>
        <div style={{ color: '#888', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
          Did you know?
        </div>
        <div style={{ color: '#ccc', fontSize: 13, lineHeight: 1.5 }}>
          <span style={{ color: '#fff', fontWeight: 700 }}>{country.name}</span> is {country.funFact.charAt(0).toLowerCase() + country.funFact.slice(1)}
        </div>
      </div>
      <div style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>Next puzzle in</div>
      <div style={{
        fontVariantNumeric: 'tabular-nums',
        fontSize: 32,
        fontWeight: 800,
        color: '#4A90D9',
        letterSpacing: 2,
      }}>
        {countdown}
      </div>
      <div style={{ color: '#555', fontSize: 11, marginTop: 8 }}>
        Come back tomorrow for a new country 🌍
      </div>
    </div>
  )
}

const countryNames = countries.map(c => c.name)
countries.forEach(c => {
  if (c.aliases) countryNames.push(...c.aliases)
})

const isDevMode = new URLSearchParams(window.location.search).has('dev')

function devDateKey(offset) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function App() {
  const { user, signInWithGoogle, signInWithMagicLink, signOut } = useAuth()
  const { collectedCountries, addToAtlas } = useAtlas(user)

  const [devOffset, setDevOffset] = useState(0)
  const [bonusKey, setBonusKey] = useState(null)
  const [bonusCount, setBonusCount] = useState(0)
  const [showAdGate, setShowAdGate] = useState(false)

  const gameKey = bonusKey || (isDevMode ? devDateKey(devOffset) : null)

  const {
    currentCountry,
    guesses,
    guessCount,
    gameStatus,
    makeGuess,
    resetGame,
  } = useGameLogic(collectedCountries, gameKey)
  const { currentStreak, bestStreak, recordWin, recordLoss } = useStreak(user)
  const { switchMode, bonusPlaysToday, proUser, canPlayBonus, unlockBonus, FREE_BONUS_LIMIT } = usePuzzleMode()

  const [revealDismissed, setRevealDismissed] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showAtlasModal, setShowAtlasModal] = useState(false)

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

  function handleUnlockBonus() {
    unlockBonus()
    setBonusKey(devDateKey(365 + bonusCount * 37))
    setBonusCount(c => c + 1)
    setRevealDismissed(false)
    setShowAdGate(false)
  }

  function handleProBonus() {
    setBonusKey(devDateKey(365 + bonusCount * 37))
    setBonusCount(c => c + 1)
    setRevealDismissed(false)
  }

  function handleShare() {
    if (!currentCountry) return
    const text = generateShareText(
      currentCountry,
      guesses,
      gameStatus === 'won',
    )
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!')
    })
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

      {isDevMode && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99998,
          background: '#FF6B35', color: '#fff', fontSize: 12, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          padding: '6px 16px',
        }}>
          <span>🛠 DEV MODE — offset: {devOffset > 0 ? `+${devOffset}` : devOffset}</span>
          {currentCountry && <span>Country: {currentCountry.name}</span>}
          <button
            onClick={() => { setDevOffset(o => o + 1); setRevealDismissed(false) }}
            style={{ background: '#fff', color: '#FF6B35', border: 'none', borderRadius: 6, padding: '2px 10px', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}
          >
            Next Puzzle →
          </button>
          <button
            onClick={() => { setDevOffset(0); setRevealDismissed(false) }}
            style={{ background: 'rgba(255,255,255,0.25)', color: '#fff', border: 'none', borderRadius: 6, padding: '2px 10px', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}
          >
            Reset
          </button>
        </div>
      )}

      <header id="globeiq-header" style={{ position: 'relative', overflow: 'visible', marginTop: isDevMode ? 36 : 0 }}>
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
          <div
            className="atlas-badge"
            onClick={() => setShowAtlasModal(true)}
            style={{ cursor: 'pointer' }}
          >🗺️ {collectedCountries.length}/195</div>
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
        {gameStatus === 'playing' && !isDevMode && collectedCountries.includes(String(currentCountry.id)) && (
          <AlreadyPlayedToday country={currentCountry} />
        )}

        {gameStatus === 'playing' && (isDevMode || !collectedCountries.includes(String(currentCountry.id))) && (
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
              onDismiss={() => setRevealDismissed(true)}
            />
            <button className="share-button" onClick={handleShare}>
              📋 Share Result
            </button>
          </>
        )}

        {(gameStatus === 'won' || gameStatus === 'lost') && revealDismissed && (
          <>
            <button
              type="button"
              className="reveal-pill"
              onClick={() => setRevealDismissed(false)}
            >
              {gameStatus === 'won'
                ? '🎉 You got it! Tap to see result'
                : 'See result →'}
            </button>
            <HintPanel guessCount={6} country={currentCountry} />
          </>
        )}

        {(gameStatus === 'won' || gameStatus === 'lost') && (
          <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
            {proUser ? (
              <button
                onClick={handleProBonus}
                style={{
                  background: '#4A90D9', color: '#fff', border: 'none',
                  borderRadius: 12, padding: '12px 28px', fontWeight: 700,
                  fontSize: 15, cursor: 'pointer',
                }}
              >
                Play another →
              </button>
            ) : canPlayBonus() ? (
              <>
                <div style={{ color: '#888', fontSize: 13, marginBottom: 10 }}>
                  Play another?&nbsp;
                  <span style={{ color: '#fff', fontWeight: 600 }}>
                    {FREE_BONUS_LIMIT - bonusPlaysToday} bonus puzzle{FREE_BONUS_LIMIT - bonusPlaysToday !== 1 ? 's' : ''} remaining
                  </span>
                </div>
                <button
                  onClick={() => setShowAdGate(true)}
                  style={{
                    background: '#1a2540', color: '#fff', border: '1px solid #4A90D940',
                    borderRadius: 12, padding: '12px 24px', fontWeight: 700,
                    fontSize: 15, cursor: 'pointer',
                  }}
                >
                  🎬 Watch Ad for Bonus Puzzle
                </button>
              </>
            ) : (
              <div style={{ color: '#666', fontSize: 13, lineHeight: 1.6 }}>
                No bonus puzzles left today.<br />
                <span style={{ color: '#aaa' }}>Come back tomorrow or go Pro for unlimited!</span>
              </div>
            )}
          </div>
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
      {showAtlasModal && (
        <AtlasModal
          collectedCountries={collectedCountries}
          allCountries={countries}
          onClose={() => setShowAtlasModal(false)}
        />
      )}
      {showAdGate && (
        <AdGate
          onUnlock={handleUnlockBonus}
          onClose={() => setShowAdGate(false)}
          bonusPlaysToday={bonusPlaysToday}
          FREE_BONUS_LIMIT={FREE_BONUS_LIMIT}
        />
      )}
    </div>
  )
}

export default App
