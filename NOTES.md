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

---

## Current status (as of 2026-05-03)

### Completed this session
- **Difficulty rebalanced**: 31 easy / 80 medium / 84 hard (was 14/31/150)
- **HowToPlay modal**: compact layout, correct hint order, no scroll needed
- **Supabase auth**: Sign In button in header, Google OAuth + magic link, `AuthModal` via React Portal
- **User menu**: native `confirm()` dialog showing "Signed in as [email]" — no dropdown, no z-index issues
- **Data sync**: atlas + streak sync to Supabase for logged-in users (`syncService.js`)
- **ISO IDs zero-padded**: all 195 country IDs are 3-digit strings (e.g. `"036"`)
- **50m topology**: switched from 110m → 50m world-atlas for higher resolution silhouettes
- **Micro Nation mystery card**: spinning 🌍 globe + hint text + badge for countries with no topology path
- **Silhouette centering**: two-step bounds-centroid approach centers every country mathematically
- **Hover tooltips**: collected countries on WorldMap show name tooltip on hover
- **Sound effects**: Web Audio API — correct, wrong, reveal, streak fanfare (`src/utils/sound.js`)
- **Frosted glass dropdown**: GuessInput autocomplete is semi-transparent with `backdrop-filter: blur(8px)`
- **Dropdown direction**: flips above input when near bottom of screen
- **Flag hidden in dropdown**: no flag emoji in autocomplete (flag is hint 6)
- **Auto-focus input**: 500ms delayed focus on new puzzle, suppressed on programmatic focus
- **WorldMap stacking context fix**: removed `willChange`/`WebkitTransform` from wrapper div
- **AuthModal portal**: renders via `createPortal` to `document.body`, z-index 99999/100000
- **Mobile Safari SVG fix**: explicit `xmlns`, `width`/`height` attrs, try/catch on projection

### Header
- 🌍 GlobeIQ logo left
- Right: `?` help · 🔥 streak · 🗺️ X/195 · Sign In (or email button)

### 195 countries complete in `src/data/countries.js`

---

## File map

### Entry / root

- **`src/main.jsx`** — Vite entry. Mounts `<App />` in `#root`.
- **`src/App.jsx`** — Root component. Hook order: `useAuth` first, then `useAtlas(user)`, `useGameLogic`, `useStreak(user)`, `usePuzzleMode`. Sound effects via two `useEffect`s (win/loss + wrong guess). Renders `WorldMap`, header, game area, `HowToPlay` modal, `AuthModal`.
- **`src/index.css`** — minimal CSS reset.
- **`src/styles/main.css`** — all GlobeIQ component styling.

### Data + utils

- **`src/data/countries.js`** — 195 country objects. Each has: `id` (3-digit ISO numeric string), `name`, `continent`, `population`, `capital`, `flagEmoji`, `difficulty` (easy/medium/hard), `climate`, `borders`, `knownFor`, `funFact`, `personalityTags`, `continentColor`. Optional: `aliases`.
- **`src/data/schema.sql`** — Supabase table definitions: `players`, `atlas`, `streaks`. Run in Supabase SQL editor to create tables.
- **`src/utils/continentTheme.js`** — `getContinentTheme(continent)` → `{ primary, background, glow }`.
- **`src/utils/shareCard.js`** — `generateShareText(country, guesses, won, puzzleNumber)`.
- **`src/utils/supabase.js`** — Supabase client singleton from `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.
- **`src/utils/syncService.js`** — `createPlayerIfNotExists`, `syncAtlasToCloud`, `loadAtlasFromCloud`, `syncStreakToCloud`, `loadStreakFromCloud`. All try/catch, fail silently.
- **`src/utils/sound.js`** — Web Audio API sound effects: `playCorrect`, `playWrong`, `playReveal`, `playStreak`. No external libs.

### Hooks (`src/hooks/`)

- **`useGameLogic(collectedCountries)`** — main game state. `MAX_GUESSES = 7`. Picks country, manages guesses, persists to localStorage.
- **`useAtlas(user)`** — collected country IDs. On mount: merges localStorage + cloud if logged in. `addToAtlas` syncs to cloud.
- **`useStreak(user)`** — streak tracking. On mount: takes max of local + cloud values. `recordWin`/`recordLoss` sync to cloud.
- **`useAuth()`** — `user`, `loading`, `signInWithGoogle`, `signInWithMagicLink`, `signOut`, `onAuthStateChange` listener.
- **`usePuzzleMode()`** — daily vs bonus mode + bonus play limit stub.

### Components (`src/components/`)

- **`WorldMap.jsx`** — fixed background SVG, 50m resolution. Hover tooltip on collected countries. No `willChange`/`transform` (avoids stacking context).
- **`Silhouette.jsx`** — 220×220 country shape. Two-step centering (fitExtent + bounds centroid). Falls back to animated "Micro Nation" mystery card for missing topology. Imports `gameCountries` internally for hint text.
- **`DifficultyAura.jsx`** — pill badge: green/amber/red.
- **`HintPanel.jsx`** — 6 hints revealed one per wrong guess: Continent → Climate → Borders → Known For → Capital → Flag.
- **`GuessInput.jsx`** — autocomplete with frosted glass dropdown. Flips above input near screen bottom. Auto-focuses on `puzzleKey` change. Dropdown suppressed on programmatic focus (`userInteracted` state).
- **`RevealCard.jsx`** — end-of-game card with facts, share button, dismiss.
- **`HowToPlay.jsx`** — compact modal, fits without scrolling, correct hint order.
- **`AuthModal.jsx`** — Google + magic link auth. React Portal to `document.body`. z-index 99999.
- **`StreakMap.jsx`** — exists but not rendered. Can be deleted.

---

## Hint order (7 guesses, 6 hints)

| Guess | Hint revealed |
|---|---|
| 1 | 🌍 Continent |
| 2 | 🌡️ Climate & Terrain |
| 3 | 🗺️ Borders |
| 4 | 🏆 Known For |
| 5 | 🏙️ Capital City |
| 6 | 🚩 Flag |
| 7 | (no new hint — last chance) |

---

## localStorage keys

| Key | Owner | Shape |
|---|---|---|
| `globeiq_daily_country` | `useGameLogic` | `{ date, countryId, guesses, guessCount, gameStatus }` |
| `globeiq_recent` | `useGameLogic` | `string[]` (max 5 IDs) |
| `globeiq_atlas` | `useAtlas` | `string[]` ISO IDs |
| `globeiq_streak` | `useStreak` | `{ currentStreak, bestStreak, lastPlayedDate }` |
| `globeiq_mode` | `usePuzzleMode` | `{ mode, bonusPlaysToday, date }` |
| `globeiq_visited` | `App.jsx` | `"true"` |

**Reset everything:**
```js
;['globeiq_daily_country','globeiq_atlas','globeiq_streak','globeiq_mode','globeiq_visited','globeiq_recent']
  .forEach(k => localStorage.removeItem(k))
```

---

## Supabase setup

- Project URL: `https://pkteppkfontnygzvwsof.supabase.co`
- Env vars needed in Vercel: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Tables: run `src/data/schema.sql` in Supabase SQL editor
- Auth providers to enable: Google OAuth, Email (magic link)
- Set redirect URL in Supabase Auth settings: `https://globe-iq-one.vercel.app`

---

## Still needed

1. **Large country silhouette scaling** — Russia, USA, Canada appear too small in the 220×220 box
2. **Test auth end-to-end** — Google OAuth + magic link sign-in on live site
3. **Ad integration** — AdSense or similar
4. **Stripe Pro tier** — $3–5/month unlock
5. **Custom domain**
6. **Launch marketing**

---

## Known issues / TODOs

1. **`puzzleNumber` in share text** — uses ISO numeric ID, needs sequential puzzle index (days since launch).
2. **`unlockBonus()`** — stub in `usePuzzleMode`, not wired to anything.
3. **`Silhouette.revealed`** — always `false` from App.jsx (intentional during play).
4. **`StreakMap.jsx`** — still exists, never rendered, can be deleted.

---

## Quick architectural cheatsheet

- **Game state**: `useGameLogic` owns `currentCountry`, `guesses`, `guessCount`, `gameStatus`.
- **CSS**: `src/styles/main.css` for all rules. Inline `style` only for dynamic theme values.
- **Daily rollovers**: each hook does its own `todayKey()` comparison on mount.
- **Country selection**: excludes collected + last 5 recent. Falls back if pool < 3.
- **Alias matching**: `useGameLogic.makeGuess()` checks `country.name` and `country.aliases[]`.
- **Z-stacking**: `WorldMap` is `position: fixed; z-index: 0`. Header/game area `z-index: 1`. `AuthModal` portal `z-index: 99999`.
- **Sound effects**: wrong guess detected via `prevGuessCountRef` + `guessCount` effect; win/loss via separate `gameStatus` effect with `soundReadyRef` to skip initial mount.
