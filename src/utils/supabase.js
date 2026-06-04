import { createClient } from '@supabase/supabase-js'

// Supabase powers OPTIONAL features: account sign-in and cross-device cloud
// sync of the atlas/streak. The core game runs entirely on localStorage and
// must work even when Supabase is unconfigured or unreachable. Historically
// `createClient('', '')` threw at module load and blanked the entire app when
// the env vars were missing (e.g. local dev without secrets). We now detect
// that case and fall back to a no-op stub so the game degrades gracefully to
// anonymous-only mode instead of crashing.

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && key)

function makeStub() {
  const subscription = { unsubscribe() {} }
  const authUnavailable = () =>
    Promise.resolve({
      data: { user: null, session: null },
      error: new Error(
        'Sign-in is unavailable right now. The game still works — your progress is saved on this device.',
      ),
    })

  // A chainable query builder whose terminal awaits resolve to empty results.
  const builder = () => {
    const b = {
      select: () => b,
      eq: () => b,
      order: () => b,
      limit: () => b,
      single: () => Promise.resolve({ data: null, error: null }),
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      upsert: () => Promise.resolve({ data: null, error: null }),
      insert: () => Promise.resolve({ data: null, error: null }),
      delete: () => b,
      then: (resolve, reject) =>
        Promise.resolve({ data: [], error: null }).then(resolve, reject),
    }
    return b
  }

  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription } }),
      signInWithOAuth: authUnavailable,
      signInWithOtp: authUnavailable,
      signOut: () => Promise.resolve({ error: null }),
    },
    from: () => builder(),
  }
}

const supabase = isSupabaseConfigured ? createClient(url, key) : makeStub()

if (!isSupabaseConfigured && import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.warn(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set — ' +
      'running in anonymous-only mode (no sign-in or cloud sync).',
  )
}

export default supabase
