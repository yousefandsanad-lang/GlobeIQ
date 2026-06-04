import { useEffect, useRef, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import useGameLogic from './hooks/useGameLogic'
import useAtlas from './hooks/useAtlas'
import useAuth from './hooks/useAuth'
import useStreak from './hooks/useStreak'
import Silhouette from './components/Silhouette'
import DifficultyAura from './components/DifficultyAura'
import HintPanel from './components/HintPanel'
import GuessInput from './components/GuessInput'
import RevealCard from './components/RevealCard'
import WorldMap from './components/WorldMap'
import HowToPlay from './components/HowToPlay'
import AuthModal from './components/AuthModal'
import AtlasModal from './components/AtlasModal'
import AtlasComplete from './components/AtlasComplete'
import CountryPage from './components/CountryPage'
import Confetti from './components/Confetti'
import { generateShareText } from './utils/shareCard'
import { playCorrect, playWrong, playReveal } from './utils/sound'
import { trackEvent } from './utils/analytics'
import AdSlot from './components/AdSlot'
import { AD_SLOT_BETWEEN_ROUNDS } from './utils/adSlots'
import countries from './data/countries'

const countryNames = countries.map(c => c.name)
countries.forEach(c => {
  if (c.aliases) countryNames.push(...c.aliases)
})

const isDevMode = import.meta.env.DEV && new URLSearchParams(window.location.search).has('dev')

function App() {
  const { user, signInWithGoogle, signInWithMagicLink, signOut } = useAuth()
  const { collectedCountries, atlasLoaded, addToAtlas } = useAtlas(user)

  const {
    currentCountry,
    guesses,
    guessCount,
    gameStatus,
    makeGuess,
    nextCountry,
    skipCountry,
  } = useGameLogic(collectedCountries, atlasLoaded)

  const { currentStreak, recordWin, recordLoss } = useStreak(user)

  const [revealDismissed, setRevealDismissed] = useState(false)
  const [showAtlasComplete, setShowAtlasComplete] = useState(false)
  const [mapMode, setMapMode] = useState(false)
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
    if (gameStatus === 'won') {
      addToAtlas(currentCountry.id)
      recordWin()
    } else if (gameStatus === 'lost') {
      recordLoss()
    }
  }, [gameStatus, currentCountry])

  // Show completion screen when atlas hits 195
  const prevAtlasCountRef = useRef(null)
  useEffect(() => {
    if (collectedCountries.length >= 195) setShowAtlasComplete(true)
    if (
      prevAtlasCountRef.current !== null &&
      prevAtlasCountRef.current < 195 &&
      collectedCountries.length >= 195
    ) {
      trackEvent('atlas_complete')
    }
    prevAtlasCountRef.current = collectedCountries.length
  }, [collectedCountries.length])

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
  }

  const [shareCopied, setShareCopied] = useState(false)
  const shareCopiedTimer = useRef(null)
  useEffect(() => () => clearTimeout(shareCopiedTimer.current), [])

  async function handleShare() {
    if (!currentCountry || (gameStatus !== 'won' && gameStatus !== 'lost')) return
    const won = gameStatus === 'won'
    const text = generateShareText(currentCountry, guesses, won, currentStreak)
    if (!text) return
    const track = method => trackEvent('share_result', {
      result: gameStatus,
      guesses_taken: guesses.length,
      method,
    })
    if (navigator.share) {
      try {
        await navigator.share({ text })
        track('web_share')
        return
      } catch (err) {
        if (err.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(text)
      track('clipboard')
      setShareCopied(true)
      clearTimeout(shareCopiedTimer.current)
      shareCopiedTimer.current = setTimeout(() => setShareCopied(false), 2000)
    } catch {
      window.prompt('Copy your result:', text)
    }
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

      <header id="globeiq-header" style={{ marginTop: isDevMode ? 36 : 0, opacity: mapMode ? 0 : 1, pointerEvents: mapMode ? 'none' : 'auto', transition: 'opacity 0.3s ease' }}>
        <a className="giq-brand" href="/" aria-label="GlobeIQ — home">
          <span className="giq-brand-mark" aria-hidden="true">🌍</span>
          <h1 className="giq-brand-text">Globe<b>IQ</b></h1>
        </a>
        <div className="giq-actions">
          <button className="giq-icon-btn" onClick={() => setShowHowToPlay(true)} aria-label="How to play">?</button>
          <span className="giq-chip is-streak" title="Current win streak">🔥 {currentStreak}</span>
          <button
            type="button"
            className="giq-chip is-atlas"
            onClick={() => setShowAtlasModal(true)}
            aria-label={`View atlas — ${collectedCountries.length} of 195 countries collected`}
          >🗺️ {collectedCountries.length}/195</button>
          <a
            href="https://buymeacoffee.com/globeiq"
            target="_blank"
            rel="noopener noreferrer"
            className="giq-icon-btn giq-support"
            onClick={() => trackEvent('support_clicked')}
            aria-label="Support GlobeIQ"
          >
            <span aria-hidden="true">☕</span>
            <span className="giq-support-label">Support</span>
          </a>
          {user ? (
            <button
              className="giq-user"
              onClick={() => { if (window.confirm(`Signed in as ${user.email}\n\nSign out of GlobeIQ?`)) signOut() }}
              title={`Signed in as ${user.email}`}
            >
              {user.email.split('@')[0]}
            </button>
          ) : (
            <button className="giq-signin" onClick={() => setShowAuthModal(true)}>
              Sign In
            </button>
          )}
        </div>
      </header>

      <Routes>
        <Route path="/" element={
          <>
            <Helmet>
              <title>GlobeIQ — Geography Guessing Game</title>
              <meta name="description" content="Guess the mystery country from 6 progressive hints — silhouette, climate, borders, region, capital, and flag. Collect all 195 countries in your personal world atlas. Free to play." />
              <link rel="canonical" href="https://globeiq.app/" />
              <meta property="og:url" content="https://globeiq.app/" />
              <meta property="og:title" content="GlobeIQ — Geography Guessing Game" />
              <meta property="og:description" content="Guess the mystery country from 6 hints. Collect all 195 countries in your world atlas. Free to play." />
            </Helmet>
            {!currentCountry ? (
              <main className="game-area"><div className="loading-state">Spinning up the globe…</div></main>
            ) : (
              <main className={`game-area${mapMode ? ' map-mode-active' : ''}`}>

              {/* Map peek back button */}
              {mapMode && (
                <button className="map-back-pill" onClick={() => setMapMode(false)}>
                  ← Back to Game
                </button>
              )}

              {/* Playing */}
              {!mapMode && gameStatus === 'playing' && (
                <>
                  <DifficultyAura difficulty={currentCountry.difficulty} />
                  <Silhouette
                    continent={currentCountry.continent}
                    revealed={false}
                    countryName={currentCountry.name}
                    countryId={currentCountry.id}
                    flagEmoji={currentCountry.flagEmoji}
                  />
                  <button className="view-map-button" onClick={() => { setMapMode(true); trackEvent('map_viewed') }}>
                    🗺️ View Map
                  </button>
                  <HintPanel guessCount={guessCount} country={currentCountry} />
                  <GuessInput
                    onGuess={makeGuess}
                    disabled={false}
                    countries={countries}
                    countryNames={countryNames}
                    previousGuesses={guesses}
                    puzzleKey={currentCountry?.id}
                  />
                  <button className="skip-button" onClick={skipCountry}>
                    Skip this country →
                  </button>
                </>
              )}

              {/* Win or Loss — show reveal card */}
              {!mapMode && (gameStatus === 'won' || gameStatus === 'lost') && !revealDismissed && (
                <>
                  {gameStatus === 'won' && <Confetti />}
                  <RevealCard
                    country={currentCountry}
                    won={gameStatus === 'won'}
                    onNext={handleNext}
                    onDismiss={() => setRevealDismissed(true)}
                  />
                  <button className="share-button" onClick={handleShare}>
                    {shareCopied
                      ? '✓ Copied to clipboard!'
                      : gameStatus === 'won'
                        ? '📋 Share your result'
                        : '📋 Share & challenge a friend'}
                  </button>
                </>
              )}

              {/* Dismissed — show pill + all hints + between-rounds ad */}
              {!mapMode && (gameStatus === 'won' || gameStatus === 'lost') && revealDismissed && (
                <>
                  <button type="button" className="reveal-pill" onClick={() => setRevealDismissed(false)}>
                    {gameStatus === 'won' ? '🎉 You got it! Tap to see result' : '😔 Tap to see card'}
                  </button>
                  <HintPanel guessCount={6} country={currentCountry} />
                  <div style={{ width: '100%', maxWidth: 480, margin: '24px auto 0' }}>
                    <AdSlot slotId={AD_SLOT_BETWEEN_ROUNDS} />
                  </div>
                </>
              )}

            </main>
            )}
          </>
        } />
        <Route path="/countries/:slug" element={
          <CountryPage
            allCountries={countries}
            collectedCountries={collectedCountries}
          />
        } />
      </Routes>

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
      {showAtlasComplete && (
        <AtlasComplete onContinue={() => setShowAtlasComplete(false)} />
      )}

      <footer className="globeiq-footer">
        <a href="/about">About</a>
        <span aria-hidden="true">·</span>
        <a href="/how-to-play">How to play</a>
        <span aria-hidden="true">·</span>
        <a href="/countries">All countries</a>
        <span aria-hidden="true">·</span>
        <a href="/contact">Contact</a>
        <span aria-hidden="true">·</span>
        <a href="/privacy">Privacy</a>
        <span aria-hidden="true">·</span>
        <a href="/terms">Terms</a>
      </footer>

    </div>
  )
}

export default App
