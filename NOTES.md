# GlobeIQ — Project Notes

Daily country-guessing game. React + Vite. Player has 7 guesses; each wrong guess reveals one more hint. Wins are saved to a personal "atlas" that highlights collected countries on a world-map background.

## Stack

- React 19 + Vite 6
- `world-atlas` + `topojson-client` + `d3-geo` for SVG maps (background WorldMap + Silhouette)
- `@supabase/supabase-js` installed but **not yet wired up** (env vars in `.env` are empty)
- Persistence: pure `localStorage`, no backend yet
- Styling: hand-rolled CSS in `src/styles/main.css` + minimal reset in `src/index.css`

Run with `npm run dev` → http://localhost:5173

---

## Current status (as of 2026-05-03)

- **195 countries** complete in `src/data/countries.js`
- **Header**: 🌍 GlobeIQ logo on left; right side has `?` help button + 🔥 streak badge + 🗺️ X/195 atlas badge
- **StreakMap card removed** — streak + atlas progress now lives entirely in the header badges
- **Browse dropdown** opens on input focus in `GuessInput.jsx`
- **Compact RevealCard** with dismiss button (`onDismiss` → `revealDismissed` state in `App.jsx`)
- **Real country silhouettes** rendering via `Silhouette.jsx` + `geoNaturalEarth1`
- **World map background** (`WorldMap.jsx`) with collected countries glowing in continent colors

---

## File map

### Entry / root

- **`src/main.jsx`** — Vite entry. Mounts `<App />` in `#root`. Imports `index.css` and `styles/main.css`.
- **`src/App.jsx`** — Root component. Calls hooks in order: `useAtlas` first (needed by `useGameLogic`), then `useGameLogic(collectedCountries)`, `useStreak`, `usePuzzleMode`. Renders `WorldMap` background, header (logo + `?` help button + 🔥 streak badge + 🗺️ atlas badge), main game area, `HowToPlay` modal on first visit. `useEffect` calls `addToAtlas` + `recordWin` on win, `recordLoss` on loss. Passes full `countries` array to `GuessInput` and `currentCountry.id` to `Silhouette`.
- **`src/index.css`** — minimal CSS reset (box-sizing, margin/padding zeroing, body line-height).
- **`src/styles/main.css`** — all GlobeIQ component styling. Defines `pulse`, `fadeIn`, `shake` keyframes. Sets `position: relative; z-index: 1` on `#globeiq-header` and `.game-area`. `.streak-badge` and `.atlas-badge` share base badge styles with individual glow box-shadows (🔥 `#E85D4A40`, 🗺️ `#4A90D940`).

### Data + utils

- **`src/data/countries.js`** — default-exports array of **195 country objects**. Each has: `id` (ISO 3166-1 numeric string), `name`, `continent`, `population`, `capital`, `flagEmoji`, `difficulty` (easy/medium/hard), `climate` (1–2 sentence description), `borders` (1 sentence), `knownFor` (full readable sentence), `funFact`, `personalityTags` (array of 2 strings), `continentColor` (hex). Some countries have an optional `aliases` array.
- **`src/utils/continentTheme.js`** — exports `getContinentTheme(continent)` → `{ primary, background, glow }`. Hardcoded map for 7 continents + white fallback.
- **`src/utils/shareCard.js`** — exports `generateShareText(country, guesses, won, puzzleNumber)`. Builds 7-square emoji row (🟢/🔴/⬜), truncates funFact to 8 words.

### Hooks (`src/hooks/`)

- **`useGameLogic(collectedCountries)`** — main game state. `MAX_GUESSES = 7`. Accepts `collectedCountries` array from `useAtlas`. On mount: restores today's saved game from localStorage or picks a new country via `pickFromAvailable()`. Persists state on every change. `makeGuess(name)` matches case-insensitively against `country.name` AND `country.aliases`. `resetGame()` picks next available country. Country selection logic: filter out collected → filter out recent (last 5, stored in `globeiq_recent`) → if remaining pool < 3, ignore recency filter → pick random.
- **`useAtlas()`** — tracks collected country IDs. State: `collectedCountries: string[]`. Loads from localStorage on mount. Returns `{ collectedCountries, addToAtlas(id), hasCountry(id), getAtlasCount() }`. `addToAtlas` is idempotent.
- **`useStreak()`** — daily streak tracking. State: `currentStreak`, `bestStreak`, `lastPlayedDate`. `recordWin()` / `recordLoss()` are no-ops if `lastPlayedDate === today`. Both use yesterday-comparison for streak continuity.
- **`usePuzzleMode()`** — daily vs bonus mode + bonus play limit. `proUser = false`, `FREE_BONUS_LIMIT = 3`. Resets `bonusPlaysToday` on new day. `unlockBonus()` is a stub (`console.log("Ad completed")`).

### Components (`src/components/`)

- **`WorldMap.jsx`** — full-viewport fixed background SVG. Projection: `geoNaturalEarth1().fitSize([1000, 500], featureCollection)`. Three country states: default (`#ffffff06`), current puzzle (`#ffffff03`), collected (continent-color at 40%/stroke 80%). Wrapped in radial-gradient vignette.
- **`Silhouette.jsx`** — 220×220 box showing the actual SVG silhouette of the current country. Uses `geoNaturalEarth1().fitExtent([[30, 30], [170, 170]], countryFeature)` so the shape fits with 30px padding on all sides. Both the outer div and the `<svg>` element have `overflow: hidden` to clip shapes that extend beyond the viewBox. Fill: white (playing) or continent primary color (revealed). Falls back to "?" text if `countryId` not found in topology. `revealed` overlay shows country name.
- **`DifficultyAura.jsx`** — small pill badge: green easy / amber medium / red hard.
- **`HintPanel.jsx`** — renders one row per `guessCount`. **6 hints** in order:
  1. 🌍 Continent
  2. 🌤️ Climate & Terrain — value pulled from `country.climate`
  3. 🗺️ Borders — value pulled from `country.borders`
  4. 🏆 Known For — 13px bold white, value from `country.knownFor`
  5. 🏙️ Capital — value from `country.capital`
  6. 🚩 Flag — 32px emoji, value from `country.flagEmoji`
- **`GuessInput.jsx`** — text input with alias-aware autocomplete (max 5 suggestions matching on name OR aliases). Dropdown opens on input focus. Strict validation: must match a canonical name or alias before `onGuess()` is called. Invalid/empty/duplicate guesses show error message (red, 12px) and trigger CSS shake animation. Dropdown stays open on invalid submit. Receives full `countries` array (not just names). Wrong-guess chips deduplicated on render via `[...new Set(previousGuesses)]`. Shows guesses remaining counter (`Math.max(0, 7 - previousGuesses.length)`).
- **`RevealCard.jsx`** — end-of-game card: continent-color header on win / dark on loss, facts grid (Capital / Population / Known For / Continent), personality tags, fun-fact, "Next Puzzle →" button, dismiss button (`onDismiss`). Compact layout.
- **`HowToPlay.jsx`** — full-screen modal. Click outside to close. Hint list matches current 6-hint system. Auto-shown on first visit (`globeiq_visited` key). Reopen via `?` header button.
- **`StreakMap.jsx`** — still exists in `src/components/` but is **no longer rendered**. Can be deleted or repurposed later.

---

## Hint order (current — 7 guesses, 6 hints)

| Guess | Hint revealed |
|---|---|
| 1 | 🌍 Continent |
| 2 | 🌤️ Climate & Terrain |
| 3 | 🗺️ Borders |
| 4 | 🏆 Known For |
| 5 | 🏙️ Capital |
| 6 | 🚩 Flag |
| 7 | (no new hint — last chance) |

---

## localStorage keys

| Key | Owner | Shape | Notes |
|---|---|---|---|
| `globeiq_daily_country` | `useGameLogic` | `{ date, countryId, guesses, guessCount, gameStatus }` | Today's puzzle + progress. Rolls to new puzzle when date changes. |
| `globeiq_recent` | `useGameLogic` | `string[]` (max 5 IDs) | Last 5 country IDs seen. Avoids immediate repeats. Ignored if available pool drops below 3. |
| `globeiq_atlas` | `useAtlas` | `string[]` | ISO 3166-1 numeric IDs of every country the user has won. Drives WorldMap highlighting and country selection filtering. |
| `globeiq_streak` | `useStreak` | `{ currentStreak, bestStreak, lastPlayedDate }` | Streak counter + last play date. |
| `globeiq_mode` | `usePuzzleMode` | `{ mode, bonusPlaysToday, date }` | Daily/bonus mode + per-day bonus play counter. |
| `globeiq_visited` | `App.jsx` | `"true"` (string) | Set when HowToPlay modal is closed. Suppresses auto-open on subsequent visits. |

**Reset everything for testing:**
```js
;['globeiq_daily_country','globeiq_atlas','globeiq_streak','globeiq_mode','globeiq_visited','globeiq_recent']
  .forEach(k => localStorage.removeItem(k))
```

---

## Known issues

1. **Floating silhouette near input** — country silhouette can visually overlap or float near the guess input box in certain viewport sizes. Needs layout fix.
2. **`puzzleNumber` in share text** — `generateShareText` receives `currentCountry.id` (ISO numeric) as the puzzle number. Needs a real sequential puzzle index (e.g. days since launch date).
3. **`unlockBonus()`** is a stub. Bonus mode UI exists but is not wired to anything meaningful.
4. **`Silhouette.revealed`** prop is always passed as `false` from App.jsx — the country-name overlay never shows during active play (intentional), but the code is wired and works if `revealed={true}` is passed.

---

## What needs to be built next

1. **Supabase auth** — magic link + Google OAuth. `.env` already has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (currently empty). Wire up the client in a `src/lib/supabase.js` module. Goals: user accounts, cloud sync for atlas + streak, leaderboard.
2. **Sound effects** — short audio cues for correct guess, wrong guess, game win/loss, hint reveal. Lightweight (Web Audio API or small MP3s).
3. **Deploy to Vercel** — add `vercel.json` if needed, connect repo, set env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in Vercel dashboard.
4. **Fix floating silhouette** — silhouette overlaps or floats near the guess input in some viewports. Investigate layout stacking in `.game-area`.

---

## Quick architectural cheatsheet

- **Where does game state live?** `useGameLogic` owns `currentCountry`, `guesses`, `guessCount`, `gameStatus`. Siblings: `useAtlas`, `useStreak`, `usePuzzleMode`.
- **Where does CSS live?** `src/styles/main.css` for all rules. Component-local `style={...}` only for dynamic theme-driven values (continent colors, progress widths, etc.).
- **Where do daily rollovers happen?** Each hook does its own `todayKey()` comparison on mount.
- **How does country selection avoid repeats?** Two-layer filter in `pickFromAvailable()`: (1) exclude `collectedCountries`, (2) exclude last 5 seen (`globeiq_recent`). Falls back to collected-only pool if recent filter leaves fewer than 3 options.
- **How does alias matching work?** `useGameLogic.makeGuess()` checks guess against `country.name` and `country.aliases[]` (case-insensitive). `GuessInput` autocomplete also matches on aliases but always displays/submits the canonical name.
- **Where is the world-map z-stacking decided?** `WorldMap` is `position: fixed; z-index: 0`. `#globeiq-header` and `.game-area` are `position: relative; z-index: 1`.
- **What fields does each country object require?** `id`, `name`, `continent`, `population`, `capital`, `flagEmoji`, `difficulty`, `climate`, `borders`, `knownFor`, `funFact`, `personalityTags`, `continentColor`. Optional: `aliases`.
