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
// "Play today's puzzle" links pointing at #globeiq-app. A bare hash anchor
// only scrolls the FIRST time (no-op once the hash is already set), and a
// link to "/" used to just reload in place — both felt like "nothing happens"
// on mobile. On the first tap, let the browser's own native hash-jump handle
// it (zero JS required, can't silently fail). Only once the hash already
// matches — so the native jump would be a no-op — do we take over and drive
// the scroll ourselves, so repeat taps still work.
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href="#globeiq-app"]')
  if (!link) return
  if (window.location.hash !== '#globeiq-app') return
  e.preventDefault()
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
)
