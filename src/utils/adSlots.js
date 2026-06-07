// ── Adsterra ad configuration ────────────────────────────────────────────────
//
// GlobeIQ monetizes via Adsterra (AdSense rejected the site as a game/"low value
// content"; Adsterra approves games and has no traffic minimum).
//
// ACTIVATION (after you sign up at https://adsterra.com and create ad units):
//   1. Create units using the BANNER and/or NATIVE BANNER formats ONLY.
//      Do NOT enable Popunder / Social Bar / Push — they wreck the game UX.
//   2. Each unit's snippet gives you a `key` and an invoke.js URL (`src`),
//      e.g. src = "//www.highperformanceformat.com/<key>/invoke.js"
//           or  "//pl0000000.profitablecpmrate.com/<key>/invoke.js"
//   3. Set these as Vercel env vars (Project → Settings → Environment Variables),
//      OR hardcode them below. They are NOT secret (they ship in client code).
//   4. The CSP in vercel.json already allowlists Adsterra's common serving
//      domains (*.highperformanceformat.com, *.profitablecpmrate.com,
//      *.profitableratecpm.com, *.profitabledisplaynetwork.com) across
//      script-src/img-src/frame-src/connect-src. Adsterra ROTATES domains — if
//      your snippet's invoke.js host isn't one of those, add it to those four
//      directives in vercel.json, or the enforced CSP will block the ad.
//      (Verify after deploy: open the page, check the console for "Refused to
//      load … Content Security Policy" and add any blocked host.)
//
// Until a unit has both `key` and `src`, its slot renders nothing (no broken
// layout, no errors) — so the site is safe to ship before activation.

const env = import.meta.env

export const ADSTERRA = {
  // Shown after a win/loss, between rounds — the highest-engagement placement.
  betweenRounds: {
    key: env.VITE_ADSTERRA_BETWEEN_KEY || '',
    src: env.VITE_ADSTERRA_BETWEEN_SRC || '',
    type: env.VITE_ADSTERRA_BETWEEN_TYPE || 'native', // 'native' | 'banner'
    width: Number(env.VITE_ADSTERRA_BETWEEN_W) || 300,
    height: Number(env.VITE_ADSTERRA_BETWEEN_H) || 250,
  },
  // Inside the Atlas modal footer.
  atlasModal: {
    key: env.VITE_ADSTERRA_ATLAS_KEY || '',
    src: env.VITE_ADSTERRA_ATLAS_SRC || '',
    type: env.VITE_ADSTERRA_ATLAS_TYPE || 'banner',
    width: Number(env.VITE_ADSTERRA_ATLAS_W) || 300,
    height: Number(env.VITE_ADSTERRA_ATLAS_H) || 250,
  },
  // Bottom of the in-app country detail route.
  countryPage: {
    key: env.VITE_ADSTERRA_COUNTRY_KEY || '',
    src: env.VITE_ADSTERRA_COUNTRY_SRC || '',
    type: env.VITE_ADSTERRA_COUNTRY_TYPE || 'banner',
    width: Number(env.VITE_ADSTERRA_COUNTRY_W) || 728,
    height: Number(env.VITE_ADSTERRA_COUNTRY_H) || 90,
  },
}

// True once at least one unit is configured — handy for conditionals/telemetry.
export const adsConfigured = Object.values(ADSTERRA).some(u => u.key && u.src)
