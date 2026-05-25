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

## Current status (as of 2026-05-16)

### Open right now

**Waiting on Google AdSense re-review.** Site `globeiq.app` was rejected once on
2026-05-16 for "Low value content" — fixed in branch
`claude/compassionate-feistel-73a546` (commit `939fb6e`). After that branch
merges to main and Vercel deploys, go to AdSense → Sites → globeiq.app, tick
"I confirm I have fixed the issues" → "Request review". Re-review takes 1–4 weeks.

In the meantime, ads.txt status is **Authorized** and the AdSense + GA4 scripts
are wired. No ads will display until AdSense flips Approval status to **Ready**.
`<ins class="adsbygoogle">` slots already exist in 3 places and will start
filling automatically the moment approval lands — no further code needed.

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
- **Custom domain live**: `https://globeiq.app` (canonical). `https://globe-iq-one.vercel.app` still works.
- **ads.txt** in `public/` for AdSense approval.
- **Per-country trophy pages** at `/countries/<slug>` — 195 routes. Public landing pages (anyone can view) showing flag, name, silhouette, capital, climate, borders, region, known-for, fun fact. Prev/next nav cycles alphabetically through all 195. Atlas modal still gates uncollected names with 🔒 — that's where the trophy reveal lives. Small "✅ Collected" / "🔒 Not yet collected" badge on the page itself.
- **SEO per-route meta tags** via `react-helmet-async`. Country pages set unique `<title>`, description, canonical, `og:*`, `twitter:*`. Homepage `<Helmet>` mirrors the index.html defaults so SPA navigation back to `/` keeps the right tags. `index.html` no longer hardcodes canonical/og:url/twitter:url (those caused "Alternate page with proper canonical tag" exclusions for non-home routes).
- **JSON-LD per country page**: `Place` schema (name, knownFor, address, containedInPlace) + 2-step `BreadcrumbList` (GlobeIQ → Country). The continent breadcrumb step was removed because it had no `item` URL and GSC flagged it.
- **Sitemap** (`public/sitemap.xml`) — 197 URLs: `/`, `/privacy.html`, and all 195 country pages.
- **GSC**: Domain property `https://globeiq.app` added and verified. Sitemap submitted, status Success. Indexing requested for Japan, USA, China (2026-05-13).
- **GA4 key events (2026-05-14)**: centralized [src/utils/analytics.js](src/utils/analytics.js) `trackEvent()`. 13 events wired: `game_start`, `guess_submit`, `hint_reveal`, `country_skipped`, `game_won`, `game_lost` (now with `difficulty`), `share_result`, `map_viewed`, `support_clicked`, `atlas_milestone` (10/25/50/100/150), `atlas_complete`, `streak_milestone` (3/7/14/30/100), `auth_signin_completed`. All guarded by initial-mount sentinels so restored sessions don't replay milestones.
- **AdSense ad slots (2026-05-14)**: reusable [src/components/AdSlot.jsx](src/components/AdSlot.jsx) component, 3 placements wired with real slot IDs (hardcoded in [src/utils/adSlots.js](src/utils/adSlots.js) since they're public): between rounds (`8251401434`), country page bottom (`6938319760`), atlas modal footer (`5625238099`). Render `null` if slot ID env override is unset. Pre-approval: slots collapse to zero height (responsive `auto` format), no layout shift.
- **AdSense ads.txt Authorized (2026-05-15)**: AdSense's crawler accepted `public/ads.txt`. Approval status still "Getting ready" → then rejected for low value content → fix shipped (see below).
- **AdSense low-value-content fix (2026-05-16, branch `claude/compassionate-feistel-73a546`)**:
  - Per-country pages went from ~100 words of unique content to **320–400 words each**, all baked into static HTML at build time.
  - REST Countries v3.1 enrichment cached in [src/data/countries-enrichment.json](src/data/countries-enrichment.json) (256KB, 195 countries). Fetcher script: [scripts/fetch-country-enrichment.mjs](scripts/fetch-country-enrichment.mjs) (`npm run fetch:enrichment` to refresh).
  - [src/components/CountryPage.jsx](src/components/CountryPage.jsx) and [src/utils/countryEnrichment.js](src/utils/countryEnrichment.js) render: official + native names, demonym, subregion, area, precise population, languages, currencies, calling code, internet TLD, driving side, time zones, neighboring countries (linked).
  - **Build-time pre-rendering** ([scripts/prerender.mjs](scripts/prerender.mjs), runs as postbuild step): generates `dist/countries/{slug}.html` for all 195 countries with full content, meta tags, OG, Twitter cards, JSON-LD (`Place` + `BreadcrumbList`), AdSense + GA4 scripts inlined. Plus a `/countries` index hub grouping all 195 by continent (568 words). **Googlebot now sees real HTML on every URL, not an SPA shell.**
  - 4 new static content pages in `public/`: [about.html](public/about.html) (469w), [how-to-play.html](public/how-to-play.html) (623w), [terms.html](public/terms.html) (727w), [contact.html](public/contact.html) (304w). Shared style in [public/content.css](public/content.css).
  - Footer added to main React app linking to all content pages.
  - [vercel.json](vercel.json) updated with `cleanUrls: true`, `trailingSlash: false`. SPA fallback rewrite still in place — filesystem matches take precedence.
  - [public/sitemap.xml](public/sitemap.xml) extended with `/about`, `/how-to-play`, `/contact`, `/terms`, `/countries`.
  - `npm run build` now runs `vite build && node scripts/prerender.mjs`.

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
- **`src/utils/slug.js`** — `slugify(name)` and `findCountryBySlug(countries, slug)` for the `/countries/<slug>` routes. Strips diacritics and apostrophes (e.g. `"Côte d'Ivoire"` → `"cote-divoire"`).

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
- **`AtlasModal.jsx`** — Pokédex atlas. Grouped by continent. Flag images from `flagcdn.com`. Sticky headers. 44px tap targets. Mobile: single column under 400px. React Portal. Collected tiles are clickable buttons → `/countries/<slug>`; uncollected tiles are non-clickable `<div>` placeholders (🔒 ????????) so we preserve the discovery moment.
- **`CountryPage.jsx`** — `/countries/:slug` route. Public for everyone. Renders flag, name, continent, population, silhouette (revealed), capital, climate, borders, region, known-for, fun fact, "Play today's puzzle" CTA, and prev/next nav. `<Helmet>` sets per-page title, meta description, canonical, OG, Twitter. Two `<script type="application/ld+json">` blocks: `Place` + `BreadcrumbList`. The 404 case (`!country`) sets `noindex`.
- **`AtlasComplete.jsx`** — celebration screen shown when atlas hits 195/195.
- **`AdGate.jsx`** — AdSense slot wrapper (not yet enabled in production).

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

URL: `https://globeiq.app?dev`

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
- Redirect URL in Supabase Auth settings: `https://globeiq.app` (also keep `https://globe-iq-one.vercel.app` if it's still being used)

---

## Still needed

1. **Merge `claude/compassionate-feistel-73a546` to main, then request AdSense re-review.** PR URL: https://github.com/yousefandsanad-lang/GlobeIQ/pull/new/claude/compassionate-feistel-73a546. After merge + Vercel deploy, AdSense → Sites → globeiq.app → tick "I confirm I have fixed the issues" → "Request review".
2. **In GA4 console**: once new events show up in Admin → Events (~24h after first fire), toggle "Mark as key event" on `game_won`, `share_result`, `atlas_milestone`, `auth_signin_completed`, `support_clicked`. This is what AdSense's optimizer uses to identify valuable users.
3. **Large country silhouette scaling** — Russia, USA, Canada appear too small in the 220×220 box
4. **Test auth end-to-end** — Google OAuth + magic link on live site (now that custom domain is live, retest with `https://globeiq.app` redirect)
5. **`AdGate.jsx`** still uses a fake 3-second timer, not real ads. Either replace with a real rewarded-ad slot or delete the component.
6. **Stripe Pro tier** — $3–5/month unlock
7. **Launch marketing**
8. **Bundle size** — main JS bundle is now 1.53 MB (slightly larger after enrichment imports). Vite warns. Code-split when there's time.

---

## SEO architecture (new this session)

- SPA shell ([index.html](index.html)) sets generic homepage tags. **No hardcoded canonical/og:url/twitter:url** — those are per-route.
- `<HelmetProvider>` wraps `<BrowserRouter>` in [src/main.jsx](src/main.jsx).
- Homepage route in [src/App.jsx](src/App.jsx) has a `<Helmet>` block (title, description, canonical, OG).
- [src/components/CountryPage.jsx](src/components/CountryPage.jsx) sets full Helmet tags per country + 2 JSON-LD blocks. Locked tab title is NOT used — pages are public.
- Vercel rewrite ([vercel.json](vercel.json)) sends every path to `index.html`; React Router resolves the route; Helmet swaps in the right tags before Google's JS-rendering pass picks them up.
- `react-helmet-async` in `package.json`.

**Pre-rendering DONE (2026-05-16)**: the SPA limitation noted previously is resolved. [scripts/prerender.mjs](scripts/prerender.mjs) generates static HTML for every country page + a `/countries` index hub at build time. Googlebot and AdSense now see fully-baked content with all metadata + JSON-LD, not a React shell. SPA-style navigation continues to work because React Router handles in-app transitions; direct visits hit the static files (filesystem match wins over the SPA rewrite). The Helmet-based per-route tags still exist as a fallback for routes not pre-rendered.

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

### GSC issues to monitor / validate

After the fix from commit `532cce4` deploys, click "Validate fix" in GSC for each:

- [ ] **Breadcrumbs: Missing field "item"** — fixed by dropping the continent step from the BreadcrumbList JSON-LD.
- [ ] **Alternate page with proper canonical tag** — fixed by removing the hardcoded canonical/og:url/twitter:url from `index.html` so Helmet's per-route tags aren't overridden in initial HTML.
- [ ] **Page with redirect** — needs investigation. Click "Open indexing report" in the email and check which URLs are affected. Usually www↔apex or http↔https (benign). If they're real content URLs redirecting unexpectedly, dig in.

### When to check progress

- **~2026-05-20** (week 1): GSC → Pages report. How many of the 197 sitemap URLs show "Indexed"?
- **~2026-05-28** (week 2): GSC → Performance. First impressions should start appearing for the manually-requested URLs.
- **~2026-06-14** (month 1): if indexing is still <20% of pages, consider build-time prerendering.

---

## Session log — 2026-05-14 → 2026-05-16 (branch `claude/compassionate-feistel-73a546`)

Goal of the session: "add key events to make money" → resolved into a two-stage push to actually monetize.

**Stage 1: GA4 events + AdSense slots (commits `7b4ee00`, `84b798b`)**

- Built [src/utils/analytics.js](src/utils/analytics.js) as a single chokepoint for `gtag` calls.
- Instrumented 13 GA4 events across `useGameLogic`, `useAtlas`, `useStreak`, `useAuth`, `HintPanel`, `App`. All initial-mount-guarded.
- Built reusable [src/components/AdSlot.jsx](src/components/AdSlot.jsx). Renders `<ins class="adsbygoogle">` and calls `adsbygoogle.push({})` exactly once per mount.
- Dropped slot units at: between rounds (after reveal dismissed), bottom of CountryPage, footer of AtlasModal.
- Created 3 AdSense ad units in console, hardcoded their slot IDs (they're public — they render in HTML).

**Stage 2: AdSense rejection + fix (commit `939fb6e`)**

- ads.txt flipped to "Authorized" on 2026-05-15 ✓.
- Then on 2026-05-16, AdSense Approval status → **"Needs attention"** with **"Low value content"** policy violation. Diagnosis: pure-SPA site shipping 195 country pages as identical empty `<div id="root">` shells with ~100 words of unique content each.
- Fix shipped: REST Countries enrichment + 320–400 words of unique narrative + structured facts per country + 4 substantial content pages (about/how-to-play/terms/contact at 304–727 words) + build-time pre-rendering of all 195 country pages and a `/countries` hub → static HTML files Googlebot and AdSense can index without JS.
- All on branch `claude/compassionate-feistel-73a546`, **not yet merged to main**. User needs to merge + redeploy + click "Request review" in AdSense.

---

## Session log — 2026-05-25 (GSC "fix failed" follow-up)

GSC emailed: "Some fixes failed for Page indexing issues on site globeiq.app" for the **Alternate page with proper canonical tag** issue.

Sanity-checked the live site — the fix from `3917fb5` is correctly deployed:

| URL | canonical |
|---|---|
| `/` | `https://globeiq.app/` ✓ |
| `/countries/japan` | `https://globeiq.app/countries/japan` ✓ |
| `/privacy`, `/about`, `/how-to-play`, `/contact`, `/terms`, `/countries` | each self-canonical ✓ |
| `http://…` and trailing-slash variants | 308 → canonical ✓ |
| `https://www.globeiq.app/*` | 200 OK, canonical points to apex (correct, but **flagged below**) |

**Likely culprit**: `www.globeiq.app` resolves with 200 OK and a canonical pointing to the apex. That's the textbook "Alternate page with proper canonical tag" pattern — Google honors the canonical but keeps listing the www URL under that issue. Validation can't "pass" while www stays reachable. Two clean fixes:

1. In Vercel domain settings, redirect `www.globeiq.app` → `globeiq.app` (308). Removes the alternate entirely.
2. Or accept it — it's informational, not a ranking penalty.

**Also tried and discarded**: a vite-prerender-plugin approach to React-SSR the routes. Realized it duplicates [scripts/prerender.mjs](scripts/prerender.mjs) (which already writes static `dist/countries/<slug>.html` with per-route canonicals). Dropped.

**Next step**: open the issue in GSC, copy the specific URLs still listed as failing. If they're all `www.globeiq.app/*`, add the redirect in Vercel. If any are apex URLs, paste them into a new session for diagnosis.

---

## Session log — 2026-05-13 → 2026-05-14

PRs #7 and #8 from `claude/mystifying-curran-210d11`, both merged. Key commits:

- `03720cf` — initial SEO PR: public country pages + `react-helmet-async` + per-route meta tags + JSON-LD (Place + BreadcrumbList).
- `669ecec` → `c126f9a` — restored lock gate then reverted; final state is public country pages with prev/next nav working on all pages.
- `9a802f8` — added the GSC indexing todo list to this file.
- `532cce4` — fixed two GSC complaints: drop continent step from BreadcrumbList (had no `item` URL), and remove hardcoded canonical/og:url/twitter:url from `index.html` so Helmet's per-route tags aren't overridden in initial HTML.

After deploy, validated `/countries/japan` in Rich Results Test and submitted indexing requests for Japan, USA, China.

---

## How to start a new session on this project

1. `cd` into the repo and read this file top-to-bottom.
2. **Check whether branch `claude/compassionate-feistel-73a546` has been merged to main yet.** If not — that's the AdSense rejection fix. Confirm with the user whether they want to merge, then nudge: PR URL https://github.com/yousefandsanad-lang/GlobeIQ/pull/new/claude/compassionate-feistel-73a546.
3. **Check AdSense status** — https://www.google.com/adsense/u/1/pub-6930930871941912/sites/list. Look at globeiq.app's Approval status column:
   - "Getting ready" or "Needs attention" → still waiting / something new flagged.
   - "Ready" → ads are live, time to optimize. Check AdSense Reports for the first revenue + ask user whether they want more slot units placed.
4. Check the deployed site at https://globeiq.app — sanity-check the homepage, a country page (e.g. `/countries/japan`), and one of the new pages (`/about`, `/how-to-play`, `/terms`, `/contact`, `/countries`).
5. Check GSC Pages report for indexing progress on the 200 sitemap URLs (now includes the 5 new content pages + the /countries hub).
6. Check the "GSC indexing — pending manual requests" section — submit the next URL if it's been ≥24h since the last batch.
7. Pick a task from "Still needed" or address any new bugs/feedback.
8. Branch is `main` for new work (unless the compassionate-feistel branch is still open). Commit + push by default (user's standing instruction).

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
