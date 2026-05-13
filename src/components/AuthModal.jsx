import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const GoogleG = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
    <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z"/>
  </svg>
)

export default function AuthModal({ onClose, signInWithGoogle, signInWithMagicLink }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleMagicLink(e) {
    e.preventDefault()
    if (!email.trim()) return
    setBusy(true)
    setError('')
    try {
      await signInWithMagicLink(email.trim())
      setSent(true)
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return createPortal(
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Sign in to GlobeIQ"
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000000CC',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0F1420',
          border: '1px solid #ffffff20',
          borderRadius: 20,
          padding: 28,
          maxWidth: 380,
          width: '100%',
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 100000,
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close sign-in dialog"
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'none',
            border: 'none',
            color: '#888',
            fontSize: 20,
            cursor: 'pointer',
            lineHeight: 1,
            padding: 0,
          }}
        >
          ✕
        </button>

        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
          Sign in to GlobeIQ
        </div>
        <div style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>
          Save your atlas and streak across devices
        </div>

        {/* Google */}
        <button
          onClick={signInWithGoogle}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            background: '#fff',
            border: 'none',
            borderRadius: 12,
            padding: '11px 16px',
            color: '#111',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: 16,
          }}
        >
          <GoogleG />
          Continue with Google
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: '#ffffff18' }} />
          <span style={{ color: '#555', fontSize: 12 }}>or</span>
          <div style={{ flex: 1, height: 1, background: '#ffffff18' }} />
        </div>

        {sent ? (
          <div style={{
            textAlign: 'center',
            padding: '20px 0',
            color: '#4A90D9',
            fontSize: 15,
            fontWeight: 600,
          }}>
            ✉️ Check your email!
            <div style={{ color: '#888', fontSize: 13, fontWeight: 400, marginTop: 6 }}>
              We sent a magic link to {email}
            </div>
          </div>
        ) : (
          <form onSubmit={handleMagicLink}>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                width: '100%',
                background: '#ffffff0A',
                border: '1px solid #ffffff20',
                borderRadius: 10,
                padding: '10px 14px',
                color: '#fff',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: 10,
              }}
            />
            {error && (
              <div style={{ color: '#E85D4A', fontSize: 12, marginBottom: 8 }}>{error}</div>
            )}
            <button
              type="submit"
              disabled={busy}
              style={{
                width: '100%',
                background: '#4A90D9',
                border: 'none',
                borderRadius: 12,
                padding: '11px 16px',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: busy ? 'not-allowed' : 'pointer',
                opacity: busy ? 0.7 : 1,
              }}
            >
              {busy ? 'Sending…' : 'Send Magic Link'}
            </button>
          </form>
        )}

        {/* Guest */}
        <button
          onClick={onClose}
          style={{
            display: 'block',
            width: '100%',
            background: 'none',
            border: 'none',
            color: '#555',
            fontSize: 13,
            cursor: 'pointer',
            marginTop: 20,
            textAlign: 'center',
          }}
        >
          Continue as Guest
        </button>
      </div>
    </div>,
    document.body
  )
}
