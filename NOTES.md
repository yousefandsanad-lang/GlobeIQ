# GlobeIQ — Project Notes

Daily country-guessing game. React + Vite. Player has 7 guesses; each wrong guess reveals one more hint. Wins are saved to a personal "atlas" that highlights collected countries on a world-map background.

## Stack

- React 19 + Vite 6
- `world-atlas` + `topojson-client` + `d3-geo` for SVG maps (background WorldMap + Silhouette)
- `@supabase/supabase-js` — wired up; auth + data sync working
- Persistence: `localStorage` (primary) + Supabase (cloud sync for logged-in users)
- Styling: hand-rolled CSS in `src/styles/main.css` + minimal reset in `src/index.css`

Run with `npm run dev` → http://localhost:5173

Live at: https://globe-iq-one.vercel.app

Dev mode: https://globe-iq-one.vercel.app?dev

---

## Current status (as of 2026-05-04)

### Completed

- **Difficulty rebalanced**: 31 easy / 80 medium / 84 hard
- **HowToPlay modal**: compact layout, correct hint order, no scroll needed
- **Supabase auth**: Sign In button in header, Google OAuth + magic link, `AuthModal` via React Portal
- **User menu**: native `confirm()` dialog showing "Signed in as [email]" — no dropdown, no z-index issues
- **Data sync**: atlas + streak sync to Supabase for logged-in users (`syncService.js`)
- **ISO IDs zero-padded**: all 195 country IDs are 3-digit strings (e.g. `"036"`)
- **50m topology**: switched from 110m → 50m world-atlas for higher resolution silhouettes
- **Micro Nation mystery card**: spinning 🌍 globe + hint text + badge for countries with no topology path
- **Invalid path fallback**: `isValidPath` check — paths that are falsy, under 10 chars, `"M0,0Z"`, or empty also show mystery card (fixes Kiribati black box)
- **Silhouette centering**: two-step bounds-centroid approach centers every country mathematically
- **iOS Safari Silhouette fix**: `xmlnsXlink`, `version="1.1"`, `WebkitBackfaceVisibility: hidden`, `WebkitTransform: translate3d(0,0,0)` on SVG
- **Hover tooltips**: collected countries on WorldMap show name tooltip on hover
- **Sound effects**: Web Audio API — correct, wrong, reveal, streak fanfare (`src/utils/sound.js`)
- **Frosted glass dropdown**: GuessInput autocomplete is semi-transparent with `backdrop-filter: blur(8px)`
- **Dropdown direction**: flips above input when near bottom of screen
- **Keyboard navigation**: ArrowDown/Up cycles options, Enter selects + submits, Escape dismisses; highlighted item scrolls into view
- **Flag hidden in dropdown**: no flag emoji in autocomplete (flag is hint 6)
- **Auto-focus input**: 500ms delayed focus on new puzzle, suppressed on programmatic focus
- **WorldMap stacking context fix**: removed `willChange`/`WebkitTransform` from wrapper div
- **AuthModal portal**: renders via `createPortal` to `document.body`, z-index 99999/100000
- **Mobile Safari SVG fix**: explicit `xmlns`, `width`/`height` attrs, try/catch on projection
- **funFacts sanitised**: 124 funFacts updated — no country name, capital name, or immediately-identifying references remain
- **AtlasModal**: Pokédex-style modal grouped by continent; click 🗺️ X/195 badge to open; collected = flag + name, undiscovered = 🔒 + ????????; sticky continent headers; 44px tap targets; single-column + 85vh on screens under 400px; React Portal. Uses `flagcdn.com` images (not emoji) for Windows compatibility.
- **South America purple**: continent theme `#9B59B6` — all 6 continents now visually distinct
- **Hint order changed**: Continent removed (color already shows it). New order: Climate & Terrain → Borders → Region → Known For → Capital → Flag
- **Region field**: all 195 countries have `region` field (e.g. "West Africa", "Southeast Asia", "Caribbean", "Southern Cone", "Baltic States", "Microstates")
- **Shared daily puzzle**: everyone on the same calendar day gets the same country. Seeded with deterministic date hash over full sorted 195-country list. Stale localStorage is discarded if `countryId` doesn't match today's seed.
- **Spoiler-free share card**: no country name, no fun fact. Shows emoji grid + "Day N" counter (days since 2026-05-04) + win/loss line + play link.
- **No infinite loop**: "Next Puzzle" button removed. After win/loss, RevealCard shows live countdown to midnight (HH:MM:SS in continent color).
- **Already-collected screen**: if today's daily country is already in atlas, shows flag + "You already have X!" + fun fact + countdown instead of broken game state.
- **Hints revealed on review**: when win/loss card is minimised, all 6 hints shown (`guessCount=6`)
- **Flag hint row height**: `.hint-row` uses `display:flex; align-items:center` so 32px flag emoji doesn't inflate row height
- **Dev mode**: `?dev` URL param enables orange toolbar with country name, offset counter, "Next Puzzle →" and "Reset" buttons. Bypasses already-collected wall and localStorage restore. No effect for regular players.

### Header
- 🌍 GlobeIQ logo left
- Right: `?` help · 🔥 streak · 🗺️ X/195 (clickable → AtlasModal) · Sign In (or email button)

### 195 countries complete in `src/data/countries.js`

---

## File map

### Entry / root

- **`src/main.jsx`** — Vite entry. Mounts `<App />` in `#root`.
- **`src/App.jsx`** — Root component. Hook order: `useAuth` first, then `useAtlas(user)`, `useGameLogic(collectedCountries, devDateKey)`, `useStreak(user)`. Dev mode detected via `URLSearchParams`. `devOffset` state drives `devDateKey`. Sound effects via two `useEffect`s. Renders `WorldMap`, header, dev toolbar, game area, modals.
- **`src/index.css`** — minimal CSS reset.
- **`src/styles/main.css`** — all GlobeIQ component styling.

### Data + utils

- **`src/data/countries.js`** — 195 country objects. Each has: `id` (3-digit ISO numeric string), `name`, `continent`, `region`, `population`, `capital`, `flagEmoji`, `difficulty` (easy/medium/hard), `climate`, `borders`, `knownFor`, `funFact`, `personalityTags`, `continentColor`. Optional: `aliases`. funFacts never reveal country name, capital, or flag.
- **`src/data/schema.sql`** — Supabase table definitions: `players`, `atlas`, `streaks`.
- **`src/utils/continentTheme.js`** — `getContinentTheme(continent)` → `{ primary, background, glow }`. South America = `#9B59B6`.
- **`src/utils/shareCard.js`** — `generateShareText(country, guesses, won)`. Spoiler-free: emoji grid + Day N + no country name. Launch date: `2026-05-04`.
- **`src/utils/supabase.js`** — Supabase client singleton.
- **`src/utils/syncService.js`** — atlas + streak cloud sync. All try/catch, fail silently.
- **`src/utils/sound.js`** — Web Audio API: `playCorrect`, `playWrong`, `playReveal`, `playStreak`.

### Hooks (`src/hooks/`)

- **`useGameLogic(collectedCountries, devDateKey)`** — main game state. `MAX_GUESSES = 7`. Picks country via `seededIndex(dateKey, 195)` over full sorted list. `devDateKey` bypasses localStorage restore and `already_collected` check. Persists to localStorage (skipped in dev mode).
- **`useAtlas(user)`** — collected country IDs. On mount: merges localStorage + cloud if logged in.
- **`useStreak(user)`** — streak tracking. `recordWin`/`recordLoss` sync to cloud.
- **`useAuth()`** — `user`, `loading`, `signInWithGoogle`, `signInWithMagicLink`, `signOut`.

### Components (`src/components/`)

- **`WorldMap.jsx`** — fixed background SVG, 50m resolution. Hover tooltip on collected countries. No `willChange`/`transform`. Projection: `geoNaturalEarth1().scale(220).translate([500, 270])`.
- **`Silhouette.jsx`** — 220×220 country shape. Two-step centering. `isValidPath` check (length > 10, not `"M0,0Z"`). iOS Safari: `xmlnsXlink`, `version="1.1"`, backface-visibility hidden, `translate3d(0,0,0)`. Mystery card fallback.
- **`DifficultyAura.jsx`** — pill badge: green/amber/red.
- **`HintPanel.jsx`** — 6 hints: Climate → Borders → Region → Known For → Capital → Flag. `guessCount` controls how many are visible.
- **`GuessInput.jsx`** — autocomplete with frosted glass dropdown. Keyboard nav: ArrowDown/Up/Enter/Escape. Flips above input near screen bottom. Auto-focuses on `puzzleKey` change.
- **`RevealCard.jsx`** — end-of-game card. Live `useCountdown` hook (HH:MM:SS to midnight) replaces old Next button. No `onNext` prop.
- **`HowToPlay.jsx`** — compact modal. Hint order: Climate → Borders → Region → Known For → Capital → Flag.
- **`AuthModal.jsx`** — Google + magic link. React Portal. z-index 99999.
- **`AtlasModal.jsx`** — Pokédex atlas. Grouped by continent. Flag images from `flagcdn.com`. Sticky headers. 44px tap targets. Mobile: single column under 400px. React Portal.

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

URL: `https://globe-iq-one.vercel.app?dev`

- Orange toolbar at top: shows current country name + day offset
- "Next Puzzle →" increments `devOffset` by 1 (seeds next day's country)
- "Reset" returns offset to 0
- Bypasses already-collected wall and localStorage restore
- Invisible to regular players (no `?dev` param)

---

## localStorage keys

| Key | Owner | Shape |
|---|---|---|
| `globeiq_daily_country` | `useGameLogic` | `{ date, countryId, guesses, guessCount, gameStatus }` |
| `globeiq_recent` | `useGameLogic` | `string[]` (max 5 IDs) |
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
- Env vars needed in Vercel: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Tables: run `src/data/schema.sql` in Supabase SQL editor
- Auth providers: Google OAuth, Email (magic link)
- Redirect URL in Supabase Auth settings: `https://globe-iq-one.vercel.app`

---

## Still needed

1. **Large country silhouette scaling** — Russia, USA, Canada appear too small in the 220×220 box
2. **Test auth end-to-end** — Google OAuth + magic link on live site
3. **Ad integration** — AdSense or similar
4. **Stripe Pro tier** — $3–5/month unlock
5. **Custom domain**
6. **Launch marketing**

---

## GSC indexing — pending manual requests

Property: `https://globeiq.app` (Domain property). Sitemap submitted, status Success.

GSC caps "Request indexing" at ~10 URLs/day. Done so far (2026-05-13): Japan, USA, China.

Submit one per day until cleared. Paste URL into URL Inspection → Test live URL → Request indexing.

- [ ] `https://globeiq.app/` (homepage)
- [ ] `https://globeiq.app/countries/india`
- [ ] `https://globeiq.app/countries/germany`
- [ ] `https://globeiq.app/countries/france`
- [ ] `https://globeiq.app/countries/united-kingdom`
- [ ] `https://globeiq.app/countries/brazil`
- [ ] `https://globeiq.app/countries/mexico`
- [ ] `https://globeiq.app/countries/italy`
- [ ] `https://globeiq.app/countries/spain`
- [ ] `https://globeiq.app/countries/russia`
- [ ] `https://globeiq.app/countries/canada`
- [ ] `https://globeiq.app/countries/australia`

After this short list, leave the remaining ~180 to Google's sitemap-driven crawl — no need to manually request all 195.

---

## Known issues / TODOs

1. **`Silhouette.revealed`** — always `false` from App.jsx (intentional during play).

---

## Quick architectural cheatsheet

- **Game state**: `useGameLogic` owns `currentCountry`, `guesses`, `guessCount`, `gameStatus`.
- **Daily country**: deterministic — `seededIndex(YYYY-MM-DD, 195)` over id-sorted list. Same for everyone on same date.
- **CSS**: `src/styles/main.css` for all rules. Inline `style` only for dynamic theme values.
- **Daily rollovers**: each hook does its own `todayKey()` comparison on mount.
- **Alias matching**: `useGameLogic.makeGuess()` checks `country.name` and `country.aliases[]`.
- **Z-stacking**: `WorldMap` z-index 0. Header/game area z-index 1. Dev toolbar z-index 99998. Portals z-index 99999.
- **Sound effects**: wrong guess via `prevGuessCountRef`; win/loss via `soundReadyRef` to skip initial mount.
- **AtlasModal trigger**: atlas-badge `onClick` → `setShowAtlasModal(true)`.
- **Share card launch date**: `2026-05-04` = Day 1. Day N = `floor((today - launchDate) / 86400000) + 1`.
