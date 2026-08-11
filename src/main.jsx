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
// not the page you're already on, so tapping it is an ordinary link
// navigation that doesn't depend on any JS running to "do" anything.
//
// But: stripping the "?play=1" back off via history.replaceState() rewrites
// the URL to exactly the plain "/" you came from — and on iOS Safari that's
// enough for it to treat this as the *same page* and restore the scroll
// position you had before (deep in the SEO content), landing you back where
// you started instead of at the top where the game is. scrollRestoration
// is a browser default we don't want here, so take manual control of it and
// force the scroll ourselves.
if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual'
}
if (window.location.search.includes('play=1')) {
  // Belt-and-suspenders: force top now, after next paint, and again once
  // everything (fonts/images) has finished loading — in case something
  // (Safari's own restoration pass included) tries to re-apply the old
  // scroll position after this script's initial run.
  const forceTop = () => window.scrollTo(0, 0)
  forceTop()
  requestAnimationFrame(forceTop)
  window.addEventListener('load', forceTop, { once: true })
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
