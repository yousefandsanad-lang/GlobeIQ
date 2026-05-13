# GlobeIQ — Project Notes

Daily country-guessing game. React + Vite. Player has 7 guesses; each wrong guess reveals one more hint. Wins are saved to a personal "atlas" that highlights collected countries on a world-map background. Each collected country also has its own permanent trophy URL (`/countries/<slug>`).

## Stack

- React 19 + Vite 6
- `react-router-dom` 6 — two routes: `/` (game) and `/countries/:slug` (trophy/locked page)
- `world-atlas` + `topojson-client` + `d3-geo` for SVG maps (background WorldMap + Silhouette)
- `@supabase/supabase-js` — auth + atlas + streak sync (working in production)
- Persistence: `localStorage` (primary) + Supabase (cloud sync for logged-in users)
- Styling: hand-rolled CSS in `src/styles/main.css` + minimal reset in `src/index.css`
- AdSense `<script>` tag in `index.html` + `public/ads.txt` for monetisation (under review)

Run with `npm run dev` → http://localhost:5173 (requires populated `.env.local` — see "Local dev" below).

**Live at:** https://globeiq.app (canonical) — also `https://globe-iq-one.vercel.app`
**Dev mode:** append `?dev` to any URL

---

## Current status (as of 2026-05-13)

### Recently shipped (this session)

- **🔥 Streak tracking actually works** — `useStreak` was previously defined but never called. Now wired in App.jsx → `recordWin`/`recordLoss` fire on game end. Streak badge renders in the header.
- **Auth works for real** — `useAuth` was hardcoding `redirectTo: 'https://globeiq.app'` (dead domain at the time). Now uses `window.location.origin`, so OAuth + magic link work from any deploy URL (production, Vercel preview, localhost). Sign-in flow has been verified end-to-end.
- **AudioContext singleton** — was created per sound call, eventually hitting per-page browser limit. Now lazy module-level singleton with `webkitAudioContext` fallback and `ctx.resume()` for auto-suspended contexts.
- **gtag hardened** — `typeof gtag === 'function'` instead of `!== 'undefined'` (defence against non-function globals).
- **Spoiler hunt** — full-dataset audit found 17 in-play country-name leaks in `climate` and `knownFor` fields (Mali, Belize, Cameroon, Chad, Republic of the Congo, Jordan, Kuwait, Malawi, Malta, Nicaragua, Panama, Sri Lanka, Zimbabwe, Czechia, Estonia, Nauru, plus Gambia missing "The Gambia" alias). All 17 fixed. **Full-dataset re-scan = 0 leaks.**
- **Dead code purge** — deleted `src/components/StreakMap.jsx` (never rendered), `src/hooks/usePuzzleMode.js` (bonus-mode scaffolding that nothing read), the ~65-line `.streak-map` CSS block, and the corresponding `switchMode` call in App.jsx. Existing users' orphaned `globeiq_mode` localStorage keys are harmless.
- **Sync diagnostics** — `syncService.js` no longer swallows every Supabase error with bare `catch {}`. Logs `console.warn` in dev (silent in prod, so users still never see sync errors).
- **Per-country trophy pages** — every country has a permanent URL at `/countries/<slug>`. Reached by tapping a collected country in AtlasModal. Locked countries (not yet collected) show 🔒 + placeholder + CTA back to the daily puzzle (Google can still index them without spoilers). Sitemap regenerated with all 195 URLs.
- **`vercel.json` SPA fallback** — without this, `/countries/japan` would 404 on direct hit or hard refresh.
- **`public/ads.txt`** — `google.com, pub-6930930871941912, DIRECT, f08c47fec0942fa0` — added to unblock AdSense site review.

### Pre-existing (≤ 2026-05-04)

- **Difficulty rebalanced**: 31 easy / 80 medium / 84 hard
- **HowToPlay modal**: compact layout, correct hint order, no scroll needed
- **Supabase auth**: Sign In button in header, Google OAuth + magic link, `AuthModal` via React Portal
- **User menu**: native `confirm()` dialog showing "Signed in as [email]"
- **Data sync**: atlas + streak sync to Supabase for logged-in users (`syncService.js`)
- **ISO IDs zero-padded**: all 195 country IDs are 3-digit strings (e.g. `"036"`)
- **50m topology**: switched from 110m → 50m world-atlas for higher resolution silhouettes
- **Micro Nation mystery card**: spinning 🌍 globe + hint text + badge for countries with no topology path
- **Invalid path fallback**: `isValidPath` check fixes Kiribati black-box
- **Silhouette centering**: two-step bounds-centroid approach
- **iOS Safari Silhouette fix**: `xmlnsXlink`, `version="1.1"`, backface-visibility hidden, `translate3d(0,0,0)` on SVG
- **Hover tooltips**: collected countries on WorldMap show name tooltip on hover
- **Sound effects**: Web Audio API — correct, wrong, reveal, streak fanfare (`src/utils/sound.js`)
- **Frosted glass dropdown**: GuessInput autocomplete with `backdrop-filter: blur(8px)`
- **Dropdown direction**: flips above input near bottom of screen
- **Keyboard navigation**: ArrowDown/Up/Enter/Escape in GuessInput
- **Flag hidden in dropdown**: no flag emoji in autocomplete (flag is hint 6)
- **Auto-focus input**: 500ms delayed focus on new puzzle
- **AuthModal portal**: renders via `createPortal` to `document.body`, z-index 99999/100000
- **funFacts sanitised**: 124 funFacts updated for the original audit (still acceptable to mention the country name in funFact since it only renders post-win on RevealCard)
- **AtlasModal**: Pokédex-style modal grouped by continent. Collected countries are now **`<button>` elements** that navigate to `/countries/<slug>` on click.
- **South America purple**: `#9B59B6` continent theme
- **Hint order**: Climate → Borders → Region → Known For → Capital → Flag
- **Region field**: all 195 countries have `region`
- **Shared daily puzzle**: `seededIndex(YYYY-MM-DD, 195)` — everyone gets the same country on the same date
- **Spoiler-free share card**: emoji grid + Day N + no country name. Launch date 2026-05-04.
- **No infinite loop**: countdown to midnight instead of "Next Puzzle" button
- **Already-collected screen**: shows flag + "You already have X!" + fun fact + countdown
- **Hints revealed on review**: dismissed win/loss shows all 6 hints (`guessCount=6`)
- **Dev mode**: `?dev` URL param adds orange toolbar with country name + Next/Reset buttons

### Header

- 🌍 GlobeIQ logo left
- Right: `?` help · `🔥 N` streak · `🗺️ X/195` (clickable → AtlasModal) · ☕ Support · Sign In (or email button)

### 195 countries complete in `src/data/countries.js`

---

## Routes

| Path | Component | Purpose |
|---|---|---|
| `/` | game UI in `App.jsx` | Daily puzzle (silhouette + hints + guess input + reveal card) |
| `/countries/:slug` | `CountryPage` | Trophy page for collected countries, 🔒 placeholder for uncollected, "Country not found" for unknown slugs |

SPA fallback configured in `vercel.json` so deep links don't 404.

---

## File map

### Entry / root

- **`src/main.jsx`** — Vite entry. Wraps `<App />` in `<BrowserRouter>` + `<StrictMode>`.
- **`src/App.jsx`** — Root component. Hook order: `useAuth` first, then `useAtlas(user)`, `useGameLogic(collectedCountries, atlasLoaded)`, `useStreak(user)`. WorldMap + header + modals render outside `<Routes>`; the `<main>` game area is wrapped inside `<Routes>` alongside the `/countries/:slug` route.
- **`src/index.css`** — minimal CSS reset.
- **`src/styles/main.css`** — all GlobeIQ component styling.
- **`vercel.json`** — SPA fallback rewrite. Filesystem-first means `ads.txt`, `sitemap.xml`, `privacy.html`, `favicon.svg`, etc. still serve as static files.

### Data + utils

- **`src/data/countries.js`** — 195 country objects. Each has: `id` (3-digit ISO numeric string), `name`, `continent`, `region`, `population`, `capital`, `flagEmoji`, `difficulty`, `climate`, `borders`, `knownFor`, `funFact`, `personalityTags`, `continentColor`. Optional: `aliases`. **No `climate`/`knownFor` field contains the country name or its aliases.**
- **`src/data/schema.sql`** — Supabase tables: `players`, `atlas`, `streaks`.
- **`src/utils/continentTheme.js`** — `getContinentTheme(continent)` → `{ primary, background, glow }`. South America = `#9B59B6`.
- **`src/utils/shareCard.js`** — `generateShareText(country, guesses, won)`. Spoiler-free: emoji grid + Day N + no country name. Launch date `2026-05-04`.
- **`src/utils/slug.js`** — `slugify(name)` (handles diacritics, apostrophes) + `findCountryBySlug(countries, slug)`. All 195 names produce unique slugs.
- **`src/utils/supabase.js`** — Supabase client singleton.
- **`src/utils/syncService.js`** — atlas + streak cloud sync. Errors surface as `console.warn` in dev only.
- **`src/utils/sound.js`** — Web Audio API: `playCorrect`, `playWrong`, `playReveal`, `playStreak`. Module-level lazy singleton `AudioContext` (with `webkitAudioContext` fallback).

### Hooks (`src/hooks/`)

- **`useGameLogic(collectedCountries, atlasLoaded)`** — main game state. `MAX_GUESSES = 7`. Picks initial country once when atlas finishes loading; safeguard effect replaces it if it ends up already-collected. `nextCountry()` + `skipCountry()` always use fresh `collectedCountries`. Persists in-progress games to `globeiq_daily_country`.
- **`useAtlas(user)`** — collected country IDs. Merges localStorage + cloud on mount.
- **`useStreak(user)`** — streak tracking. `recordWin`/`recordLoss` are guarded against double-counting on same day. Returns `currentStreak`, `bestStreak`, `recordWin`, `recordLoss`, `getStreak`.
- **`useAuth()`** — `user`, `loading`, `signInWithGoogle`, `signInWithMagicLink`, `signOut`. Redirects use `window.location.origin`.

### Components (`src/components/`)

- **`WorldMap.jsx`** — fixed background SVG, 50m resolution. Hover tooltip on collected countries. Projection: `geoNaturalEarth1().scale(220).translate([500, 270])`.
- **`Silhouette.jsx`** — 220×220 country shape. Two-step centering. `isValidPath` check. iOS Safari workarounds. Mystery card fallback for missing topology paths.
- **`DifficultyAura.jsx`** — pill badge: green/amber/red.
- **`HintPanel.jsx`** — 6 hints: Climate → Borders → Region → Known For → Capital → Flag. `guessCount` controls how many are visible.
- **`GuessInput.jsx`** — autocomplete with frosted glass dropdown. Keyboard nav. Auto-focuses on `puzzleKey` change.
- **`RevealCard.jsx`** — end-of-game card. `useCountdown` to midnight. funFact only renders when `won === true`.
- **`HowToPlay.jsx`** — compact onboarding modal.
- **`AuthModal.jsx`** — Google + magic link. React Portal.
- **`AtlasModal.jsx`** — Pokédex atlas grouped by continent. Collected rows are real `<button>`s that close the modal + `navigate('/countries/<slug>')`. Locked rows non-interactive. Flag images from `flagcdn.com`.
- **`AtlasComplete.jsx`** — celebration screen when atlas hits 195.
- **`CountryPage.jsx`** — trophy view for `/countries/:slug`. Three states: trophy (collected), locked (uncollected — 🔒 + CTA), not-found (unknown slug). Continent colour drives `--country-accent` CSS variable. Prev/next nav links alphabetically across all 195; uncollected neighbours show 🔒.

---

## Hint order (7 guesses, 6 hints)

| Guess | Hint revealed |
|---|---|
| 1 | 🌡️ Climate & Terrain |
| 2 | 🗺️ Borders |
| 3 | 📍 Region |
| 4 | 🏆 Known For |
| 5 | 🏙️ Capital City |
| 6 | 🚩 Flag |
| 7 | (no new hint — last chance) |

The silhouette border color communicates continent visually before any guesses.

---

## Dev mode

URL: `https://globeiq.app?dev` (also works with `localhost:5173?dev` or any Vercel preview URL).

- Orange toolbar at top: shows current country name + day offset
- "Next Puzzle →" advances `devOffset` (seeds next day's country)
- "Reset" returns offset to 0
- Bypasses already-collected wall and localStorage restore
- Invisible to regular players (no `?dev` param)

---

## localStorage keys

| Key | Owner | Shape |
|---|---|---|
| `globeiq_daily_country` | `useGameLogic` | `{ countryId, guesses, guessCount, gameStatus }` |
| `globeiq_recent` | `useGameLogic` | `string[]` (max 5 IDs) — recent fails to avoid immediate repeats |
| `globeiq_atlas` | `useAtlas` | `string[]` ISO IDs |
| `globeiq_streak` | `useStreak` | `{ currentStreak, bestStreak, lastPlayedDate }` |
| `globeiq_visited` | `App.jsx` | `"true"` |

**Reset everything (browser console):**
```js
;['globeiq_daily_country','globeiq_atlas','globeiq_streak','globeiq_visited','globeiq_recent']
  .forEach(k => localStorage.removeItem(k))
location.reload()
```
Note: if logged in, Supabase re-syncs atlas on reload. Sign out first to fully reset.

---

## Supabase setup

- Project URL: `https://pkteppkfontnygzvwsof.supabase.co`
- Env vars in Vercel: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (all three environments — Production, Preview, Development)
- ⚠️ **`VITE_SUPABASE_URL` must be the bare project URL** (`https://pkteppkfontnygzvwsof.supabase.co`) — NOT the Data API URL with `/rest/v1/` suffix. The Supabase JS client appends auth paths internally; if the env var includes `/rest/v1`, OAuth calls hit `/rest/v1/auth/v1/authorize` and Supabase returns "No API key found."
- ⚠️ **Don't mark Supabase env vars as "Sensitive" in Vercel** — sensitive vars can't be pulled via `vercel env pull`, which breaks local dev. The `anon` key is designed to be public (it's already in every visitor's JS bundle). Use "Encrypted" instead of "Sensitive" if you want a non-default storage class.
- Tables: run `src/data/schema.sql` in Supabase SQL editor
- Auth providers: Google OAuth, Email (magic link)
- Redirect URLs in Supabase Auth settings should include both `https://globeiq.app` and `https://globe-iq-one.vercel.app` (Vercel preview URLs are wildcarded automatically with Supabase's Site URL + Additional Redirect URLs).

---

## Local dev setup

The repo's `.env` is gitignored and empty. To boot locally:

1. Get the anon key from Supabase Dashboard → Project `pkteppkfontnygzvwsof` → Settings → API → "Project API keys" → copy the `anon` `public` row (NOT `service_role`).
2. Create `.env.local` with:
   ```
   VITE_SUPABASE_URL=https://pkteppkfontnygzvwsof.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
3. `npm run dev` → http://localhost:5173

(Vite reads `.env.local` automatically and it's gitignored. `vercel env pull` won't work because the values are marked Sensitive in Vercel.)

---

## Deployment (Vercel)

- **Production:** `globeiq.app` (also reachable at `globe-iq-one.vercel.app`)
- **Preview:** every branch push gets a preview URL like `globe-cgfrekl9d-yousefandsanad-langs-projects.vercel.app`. Vercel preview URLs are behind Vercel SSO by default.
- **Framework auto-detection:** Vite. Build command `vite build`. Output dir `dist/`.
- **SPA fallback:** `vercel.json` rewrites everything to `/index.html`. Filesystem-first means static files in `public/` (ads.txt, sitemap.xml, privacy.html, favicon.svg, robots.txt) serve as-is.
- **Env var changes don't trigger redeploys** — manually trigger a redeploy from Deployments → ⋯ → Redeploy after changing env vars. Uncheck "Use existing Build Cache" for a clean rebuild.

---

## AdSense

- **Publisher ID:** `pub-6930930871941912`
- **Account approval:** ✅ approved (payments profile complete)
- **Site approval for `globeiq.app`:** "Getting ready" → was stuck on missing ads.txt for 9 days. `public/ads.txt` was added on 2026-05-13; Google's re-crawl typically takes 24-48 hours after deploy.
- **AdSense `<script>` tag:** already in `index.html`
- **No actual ad units placed yet** — once site flips to "Ready", design placements (candidates: below GuessInput, inside RevealCard, inside HowToPlay/AtlasModal). 195 country pages will provide a much larger ad-inventory surface than the single home page.

---

## Still needed

1. ~~Large country silhouette scaling~~ — descoped (Russia/USA/Canada appearing small in 220×220 is acceptable)
2. ~~Test auth end-to-end~~ — done, working in production
3. **AdSense site approval** — waiting on Google re-crawl after `ads.txt` deploy
4. **AdSense ad placements** — design once site approved
5. **Stripe Pro tier** — $3-5/month. Decide what Pro unlocks (ad removal, historical puzzles, etc.)
6. ~~Custom domain~~ — done, `globeiq.app` is live
7. **Launch marketing** — Show HN / Reddit / Product Hunt

---

## Known issues / TODOs

1. **`Silhouette.revealed`** — always `false` from App.jsx in-game (intentional during play). `true` on CountryPage trophy view.
2. **Bundle size** — 1.3 MB minified JS, mostly `world-atlas` TopoJSON. Lazy-loading would cut initial JS by ~60% but only matters if launch traffic spikes.
3. **No `prefers-reduced-motion` support** — pulse, fade-in, and spinning Micro-Nation globe run unconditionally.
4. **GuessInput autocomplete lacks listbox ARIA semantics** — screen readers can't follow keyboard nav.
5. **`navigator.share` falls back to clipboard** — fine on iOS but the alert("Copied to clipboard!") is ugly.

---

## Quick architectural cheatsheet

- **Routes**: `/` is the game, `/countries/:slug` is the trophy view. SPA — both share the WorldMap background + header.
- **Game state**: `useGameLogic` owns `currentCountry`, `guesses`, `guessCount`, `gameStatus`.
- **Daily country**: deterministic — `seededIndex(YYYY-MM-DD, 195)` over id-sorted list. Same for everyone on same date.
- **CSS**: `src/styles/main.css` for all rules. Inline `style` only for dynamic theme values or one-off layout.
- **Daily rollovers**: each hook does its own `todayKey()` comparison on mount.
- **Alias matching**: `useGameLogic.makeGuess()` checks `country.name` and `country.aliases[]` (case-insensitive).
- **Z-stacking**: `WorldMap` z-index 0. Header/game area z-index 1. Dev toolbar z-index 99998. Portals (modals) z-index 99999+.
- **Sound effects**: wrong guess via `prevGuessCountRef`; win/loss via `soundReadyRef` to skip initial mount.
- **AtlasModal trigger**: atlas-badge `onClick` → `setShowAtlasModal(true)`. Tapping a collected country closes the modal + navigates to its trophy URL.
- **CountryPage**: collected → full trophy; not in atlas → 🔒 + CTA; unknown slug → "not found". Always shows under the same header + WorldMap as the home page.
- **Share card launch date**: `2026-05-04` = Day 1. Day N = `floor((today - launchDate) / 86400000) + 1`.

---

## Working with this codebase

- **Standing preference**: always commit + push after each logical unit (see `~/.claude/projects/-Users-essamnassar-GlobeIQ/memory/feedback_commit_push.md`).
- **Branch convention**: `claude/<name>` — preview deploy per branch on Vercel.
- **PR workflow**: open PR from branch → merge to `main` → Vercel auto-deploys production.
- **Commit message style**: short imperative subject (~60 chars), blank line, then a few sentences of body. Co-Authored-By trailer for Claude work.
