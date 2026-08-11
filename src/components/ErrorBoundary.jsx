import { Component } from 'react'

// Without this, an uncaught error anywhere in the render tree (e.g. a lazy
// chunk that fails to fetch) unmounts the ENTIRE app, leaving #root
// completely empty with no indication anything went wrong — indistinguishable
// from the game never having loaded at all.
export default class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: 24,
        textAlign: 'center',
        color: '#fff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <div style={{ fontSize: 32 }}>🌍</div>
        <div style={{ fontSize: 16, fontWeight: 700 }}>Something went wrong loading GlobeIQ</div>
        <div style={{ fontSize: 14, color: '#aaa', maxWidth: 320 }}>
          Please try reloading the page. If it keeps happening, let us know via the contact page.
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: 8,
            background: '#4A90D9',
            border: 'none',
            borderRadius: 12,
            padding: '10px 20px',
            color: '#fff',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Reload
        </button>
      </div>
    )
  }
}
