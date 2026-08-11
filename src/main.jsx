import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import './styles/main.css'
import App from './App.jsx'
import { loadWorldTopology } from './utils/topology'

// Warm the topology cache immediately (parallel with React mount) so the
// silhouette hero has its geometry ready by the time it first renders.
loadWorldTopology().catch(() => {})

// The homepage SEO content (injected below the app at build time) has
// "Play today's puzzle" links pointing at /?play=1 — a genuinely new URL,
// not the page you're already on. Two JS-dependent approaches (a bare hash
// anchor, then a hybrid native-jump-plus-scrollTo) both still reportedly did
// nothing on at least one real phone, so this intentionally depends on
// nothing but the browser's most basic behavior: a link to a URL you've
// never visited has no scroll position to restore, so it always opens at
// the top, where the game is — no JS required for the tap itself to work.
// Once loaded, strip the query param so the URL bar stays clean.
if (window.location.search.includes('play=1')) {
  window.history.replaceState(null, '', window.location.pathname + window.location.hash)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
)
