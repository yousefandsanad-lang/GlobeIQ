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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
)
