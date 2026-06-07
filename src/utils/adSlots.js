// ── Adsterra ad configuration ────────────────────────────────────────────────
//
// GlobeIQ monetizes via Adsterra (AdSense rejected the site as a game / "low
// value content"; Adsterra approves games). These keys/URLs are PUBLIC — they
// ship in client code, exactly like the old AdSense slot IDs — so they're
// hardcoded here. Each can be overridden with a VITE_ADSTERRA_* env var if you
// ever rotate units without a code change.
//
// Units (created in the Adsterra dashboard for globeiq.app, site 5832177):
//   • Native Banner  → betweenRounds (shown after a win/loss)
//   • Banner 300x250 → atlasModal   (Atlas modal footer)
//   • Banner 728x90  → countryPage  (in-app country route)
//
// Formats are intentionally BANNER + NATIVE only — no popunder/social-bar/push,
// to keep the game UX clean.
//
// CSP: the serving domains used by these units
// (pl*.effectivecpmnetwork.com for native, www.highperformanceformat.com for
// the banners) are allowlisted in vercel.json. If you add a unit whose
// invoke.js is on a different Adsterra domain, add that host to script-src/
// img-src/frame-src/connect-src there, or the enforced CSP will block it.
//
// A unit with an empty key or src renders nothing (no broken layout).

const env = import.meta.env

export const ADSTERRA = {
  betweenRounds: {
    key: env.VITE_ADSTERRA_BETWEEN_KEY || 'a5103adadd24db451285e495bb5fcb48',
    src: env.VITE_ADSTERRA_BETWEEN_SRC || 'https://pl29671018.effectivecpmnetwork.com/a5103adadd24db451285e495bb5fcb48/invoke.js',
    type: env.VITE_ADSTERRA_BETWEEN_TYPE || 'native',
    width: Number(env.VITE_ADSTERRA_BETWEEN_W) || 300,
    height: Number(env.VITE_ADSTERRA_BETWEEN_H) || 250,
  },
  atlasModal: {
    key: env.VITE_ADSTERRA_ATLAS_KEY || 'dd3a17b4eda18f8203e5735e8b215f90',
    src: env.VITE_ADSTERRA_ATLAS_SRC || 'https://www.highperformanceformat.com/dd3a17b4eda18f8203e5735e8b215f90/invoke.js',
    type: env.VITE_ADSTERRA_ATLAS_TYPE || 'banner',
    width: Number(env.VITE_ADSTERRA_ATLAS_W) || 300,
    height: Number(env.VITE_ADSTERRA_ATLAS_H) || 250,
  },
  countryPage: {
    key: env.VITE_ADSTERRA_COUNTRY_KEY || 'cfc6471b9ce3ae98729962be88aed550',
    src: env.VITE_ADSTERRA_COUNTRY_SRC || 'https://www.highperformanceformat.com/cfc6471b9ce3ae98729962be88aed550/invoke.js',
    type: env.VITE_ADSTERRA_COUNTRY_TYPE || 'banner',
    width: Number(env.VITE_ADSTERRA_COUNTRY_W) || 728,
    height: Number(env.VITE_ADSTERRA_COUNTRY_H) || 90,
  },
}

// True once at least one unit is configured — handy for conditionals/telemetry.
export const adsConfigured = Object.values(ADSTERRA).some(u => u.key && u.src)
