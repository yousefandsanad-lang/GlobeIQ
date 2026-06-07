// Vercel Cron target (scheduled in vercel.json → "crons").
//
// Supabase free-tier projects auto-pause after ~7 days of inactivity, which
// takes the project's domain offline (DNS NXDOMAIN) and breaks sign-in. A
// single daily request counts as activity and keeps the project awake, so this
// function makes one lightweight authenticated REST read once a day.
//
// Optional hardening: set a CRON_SECRET env var in Vercel and this endpoint
// will only run for requests carrying it (Vercel Cron sends it automatically).
// If CRON_SECRET is unset, the endpoint stays open — it only performs one cheap
// read, so the abuse surface is negligible.

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ ok: false, error: 'unauthorized' })
  }

  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) {
    return res.status(200).json({ ok: false, reason: 'supabase env not configured' })
  }

  try {
    const r = await fetch(`${url}/rest/v1/players?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: 'no-store',
    })
    // Any HTTP response means the project is awake; the status is just info.
    return res.status(200).json({ ok: true, pinged: url, supabaseStatus: r.status })
  } catch (err) {
    return res.status(200).json({ ok: false, error: String(err && err.message || err) })
  }
}
