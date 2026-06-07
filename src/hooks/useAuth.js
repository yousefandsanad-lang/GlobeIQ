import { useEffect, useState } from 'react'
import supabase, { isSupabaseReachable } from '../utils/supabase'
import { trackEvent } from '../utils/analytics'

export default function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (event === 'SIGNED_IN' && session?.user) {
        const provider = session.user.app_metadata?.provider ?? 'unknown'
        trackEvent('auth_signin_completed', { provider })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signInWithGoogle() {
    // Pre-flight: OAuth is a full-page redirect, so if Supabase is paused/down
    // the user would hit a raw browser error page. Fail gracefully instead.
    const reachable = await isSupabaseReachable()
    if (!reachable) {
      throw new Error('Sign-in is temporarily unavailable. Your progress is saved on this device — please try again in a bit.')
    }
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  async function signInWithMagicLink(email) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return { user, loading, signInWithGoogle, signInWithMagicLink, signOut }
}
