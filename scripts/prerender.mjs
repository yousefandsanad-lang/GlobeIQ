// Post-build pre-renderer.
// Reads dist/index.html (the Vite SPA shell) and the country data, then writes
// a fully-rendered static HTML file for every country at:
//   dist/countries/{slug}.html
// Plus an index hub at dist/countries/index.html that links to all 195.
// Also rewrites dist/index.html with rich SEO content injected below the React
// mount point, so the homepage is no longer an empty "Loading…" shell to crawlers.
//
// Vercel serves these static files in preference to the SPA fallback rewrite
// (filesystem matches always win over rewrites), so Googlebot and AdSense
// see real content while in-app React-Router navigation still works.

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync, statSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { default as countries } from '../src/data/countries.js'
import { slugify } from '../src/utils/slug.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const dist = resolve(root, 'dist')

const enrichmentRaw = JSON.parse(readFileSync(resolve(root, 'src/data/countries-enrichment.json'), 'utf-8'))

const SITE = 'https://globeiq.app'

// Build date (UTC, YYYY-MM-DD) — used as the sitemap <lastmod> fallback and for
// the homepage, which genuinely changes every day (new daily puzzle).
const TODAY = new Date().toISOString().slice(0, 10)

// Honest <lastmod>: the date a source file was last committed, so a page's
// lastmod only advances when its underlying content actually changed — not on
// every unrelated deploy (which makes Google distrust and ignore lastmod).
// Falls back to the build date if git history is unavailable (e.g. a shallow
// checkout that doesn't reach the file's last commit).
function gitDate(relPath) {
  try {
    const out = execSync(`git log -1 --format=%cs -- "${relPath}"`, {
      cwd: root, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    return /^\d{4}-\d{2}-\d{2}$/.test(out) ? out : TODAY
  } catch {
    return TODAY
  }
}

// Country reference pages are regenerated from the country data + this script's
// prose builders, so their content date is the most recent change among those.
// (Lexicographic max works for ISO dates.)
const CONTENT_DATE = [
  gitDate('src/data/countries.js'),
  gitDate('src/data/countries-enrichment.json'),
  gitDate('scripts/prerender.mjs'),
].sort().at(-1)

// slugify is imported from src/utils/slug.js so prerendered filenames, the
// in-app React Router links, the sitemap, and every canonical URL all agree.
// (A divergent local copy here previously emitted "c-te-d-ivoire.html" while
// the rest of the app linked to "cote-divoire", soft-404ing those pages.)

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]))
}

// Safely serialise an object into a <script type="application/ld+json"> block.
// JSON.stringify does NOT escape "<", so a value containing "</script>" could
// otherwise break out of the block. Escaping "<" keeps esc() a true boundary.
function jsonLd(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c')
}

const NAME_BY_CCA3 = (() => {
  const m = {}
  for (const data of Object.values(enrichmentRaw)) {
    if (data?.cca3 && data?.name?.common) m[data.cca3] = data.name.common
  }
  return m
})()

function formatArea(km2) {
  if (typeof km2 !== 'number') return null
  if (km2 >= 1_000_000) return `${(km2 / 1_000_000).toFixed(2)} million km²`
  return `${km2.toLocaleString()} km²`
}

function formatPopulation(p) {
  if (typeof p !== 'number') return null
  if (p >= 1_000_000) return `${(p / 1_000_000).toFixed(p >= 100_000_000 ? 0 : 1)} million`
  if (p >= 1_000) return `${Math.round(p / 1000).toLocaleString()} thousand`
  return p.toLocaleString()
}

function getEnrichment(country) {
  const raw = enrichmentRaw[country.id]
  if (!raw) return null
  return {
    officialName: raw.name?.official ?? null,
    nativeNames: raw.name?.nativeName
      ? Object.values(raw.name.nativeName).map(n => n.common).filter(Boolean)
      : [],
    subregion: raw.subregion ?? null,
    area: formatArea(raw.area),
    areaKm2: typeof raw.area === 'number' ? raw.area : null,
    populationPrecise: formatPopulation(raw.population),
    populationRaw: typeof raw.population === 'number' ? raw.population : null,
    currencies: raw.currencies ? Object.entries(raw.currencies).map(([code, info]) => ({
      code, name: info?.name ?? code, symbol: info?.symbol ?? null,
    })) : [],
    languages: raw.languages ? Object.values(raw.languages) : [],
    callingCode: raw.idd?.root ? `${raw.idd.root}${(raw.idd.suffixes?.length === 1) ? raw.idd.suffixes[0] : ''}` : null,
    tld: Array.isArray(raw.tld) ? raw.tld[0] : null,
    timezones: Array.isArray(raw.timezones) ? raw.timezones : [],
    drivingSide: raw.car?.side ?? null,
    neighbors: Array.isArray(raw.borders) ? raw.borders.map(c => NAME_BY_CCA3[c] ?? c) : [],
    demonym: raw.demonyms?.eng?.m ?? null,
    independent: typeof raw.independent === 'boolean' ? raw.independent : null,
    unMember: typeof raw.unMember === 'boolean' ? raw.unMember : null,
    startOfWeek: raw.startOfWeek ?? null,
    latlng: Array.isArray(raw.latlng) ? raw.latlng : null,
  }
}

// ─── Prose builders ─────────────────────────────────────────────────────────

function hemisphereFromLatLng(latlng) {
  if (!latlng) return null
  const [lat, lng] = latlng
  const ns = lat >= 0 ? 'Northern' : 'Southern'
  const ew = lng >= 0 ? 'Eastern' : 'Western'
  return { ns, ew, both: `${ns} and ${ew}` }
}

function compareArea(km2) {
  if (typeof km2 !== 'number') return null
  if (km2 < 1000) return 'one of the smallest sovereign states in the world by land area'
  if (km2 < 25_000) return 'a small country by land area'
  if (km2 < 100_000) return 'a relatively compact country by land area'
  if (km2 < 500_000) return 'a mid-sized country by land area'
  if (km2 < 2_500_000) return 'a large country by land area'
  return 'one of the largest countries in the world by land area'
}

function comparePopulation(p) {
  if (typeof p !== 'number') return null
  if (p < 100_000) return 'a microstate by population'
  if (p < 1_000_000) return 'a small nation in terms of population'
  if (p < 10_000_000) return 'a modestly populated country'
  if (p < 50_000_000) return 'a country of significant population size'
  if (p < 200_000_000) return 'one of the more populous nations on Earth'
  return 'among the most populous countries in the world'
}

function buildOverview(country, e) {
  const parts = []
  const official = e.officialName && e.officialName !== country.name ? `, officially the ${e.officialName},` : ''
  parts.push(`${country.name}${official} is a sovereign country located in ${country.continent}${e.subregion ? `, specifically within the ${e.subregion} subregion` : ''}.`)
  if (country.capital) {
    parts.push(`Its capital and largest urban centre is ${country.capital}${e.populationPrecise ? `, and the country is home to approximately ${e.populationPrecise} people` : ''}.`)
  }
  if (e.nativeNames?.length > 0) {
    parts.push(`In its native language${e.nativeNames.length > 1 ? 's' : ''}, the country is known as ${e.nativeNames.slice(0, 3).map(n => `“${n}”`).join(', ')}.`)
  }
  if (e.languages.length > 0) {
    const lang = e.languages.length === 1
      ? `${e.languages[0]} serves as the primary official language`
      : `${e.languages.slice(0, -1).join(', ')} and ${e.languages.at(-1)} are recognised as official or widely-spoken languages`
    parts.push(`${lang}, shaping daily communication, education, government, and media throughout ${country.name}.`)
  }
  if (e.currencies.length > 0) {
    const c = e.currencies[0]
    parts.push(`The official currency in circulation is the ${c.name}${c.symbol ? ` (${c.symbol})` : ''}, used for all domestic transactions and price-tagged goods.`)
  }
  parts.push(`${country.knownFor.replace(/^Famous for /, country.name + ' is widely recognised for ').replace(/^known for /i, '')}${country.knownFor.endsWith('.') ? '' : '.'}`)
  if (e.demonym) parts.push(`People from ${country.name} are referred to as ${e.demonym}.`)
  return parts.join(' ')
}

function buildGeography(country, e) {
  const parts = []
  if (e.area) {
    const cmp = compareArea(e.areaKm2)
    parts.push(`${country.name} covers approximately ${e.area} of territory, making it ${cmp}.`)
  }
  if (country.borders === 0) {
    parts.push(`The country is an island nation (or otherwise lacks land borders), surrounded entirely by water and dependent on maritime and air links to reach its neighbours.`)
  } else if (country.borders === 1) {
    parts.push(`It shares a single land border with one neighbouring country, a geographic fact that has shaped its history, trade routes, and cultural exchange.`)
  } else if (country.borders > 1) {
    parts.push(`It shares land borders with ${country.borders} neighbouring countries — a position that has historically influenced migration patterns, regional politics, and cross-border commerce.`)
  }
  if (e.latlng) {
    const hemi = hemisphereFromLatLng(e.latlng)
    if (hemi) parts.push(`Geographically, ${country.name} sits in the ${hemi.both} Hemisphere, at roughly ${Math.abs(e.latlng[0]).toFixed(1)}° ${e.latlng[0] >= 0 ? 'N' : 'S'}, ${Math.abs(e.latlng[1]).toFixed(1)}° ${e.latlng[1] >= 0 ? 'E' : 'W'}.`)
  }
  if (e.timezones.length > 0) {
    parts.push(e.timezones.length === 1
      ? `Standard civil time follows ${e.timezones[0]} year-round, simplifying scheduling for residents and visitors alike.`
      : `Because of its size and geography, the country spans ${e.timezones.length} time zones, ranging from ${e.timezones[0]} in the west to ${e.timezones.at(-1)} in the east — a logistical consideration for travel, broadcasting, and commerce.`)
  }
  if (country.climate) {
    parts.push(`The prevailing climate of ${country.name} can be summarised as: ${country.climate.toLowerCase().replace(/·/g, 'with')}. Local weather patterns naturally vary by altitude, latitude, and proximity to oceans or mountain ranges.`)
  }
  return parts.join(' ')
}

function buildPeople(country, e) {
  const parts = []
  if (e.populationPrecise) {
    const cmp = comparePopulation(e.populationRaw)
    parts.push(`With roughly ${e.populationPrecise} inhabitants, ${country.name} is ${cmp}.`)
  }
  if (e.languages.length > 0) {
    parts.push(e.languages.length === 1
      ? `The principal spoken language is ${e.languages[0]}, which dominates public life, schooling, signage, and the workplace.`
      : `Linguistic life is plural here: ${e.languages.slice(0, -1).join(', ')} and ${e.languages.at(-1)} are all in active use, with regional and minority tongues often adding further variety.`)
  }
  if (e.nativeNames?.length > 0 && e.nativeNames[0] !== country.name) {
    parts.push(`Locals refer to their homeland as ${e.nativeNames.slice(0, 2).map(n => `“${n}”`).join(' or ')}, a name with linguistic and historical roots that long predate modern borders.`)
  }
  if (e.demonym) {
    parts.push(`Citizens are formally known in English as ${e.demonym}, a demonym that appears in passports, official documents, and international reporting.`)
  }
  if (e.currencies.length > 0) {
    const list = e.currencies.map(c => `the ${c.name}${c.symbol ? ` (${c.symbol})` : ''}`).join(' and ')
    parts.push(`Economically, ${list} is the medium of exchange used by households and businesses, with exchange rates monitored by the country's central monetary authority.`)
  }
  return parts.join(' ')
}

function buildGovernment(country, e) {
  const parts = []
  if (e.independent === true) {
    parts.push(`${country.name} is recognised internationally as a sovereign, independent state.`)
  } else if (e.independent === false) {
    parts.push(`${country.name} is administered as a dependency or constituent territory rather than a fully independent state, while still appearing distinctly on world maps and in many international rankings.`)
  }
  if (e.unMember === true) {
    parts.push(`It is a member state of the United Nations, participating in the General Assembly and various specialised UN agencies.`)
  } else if (e.unMember === false) {
    parts.push(`It is not currently a member of the United Nations, though it may engage with international bodies through observer status or regional organisations.`)
  }
  parts.push(`On the global stage, ${country.name} is generally classified within the ${country.continent}${e.subregion ? ` region and more specifically the ${e.subregion} subregion` : ' region'}, alongside neighbouring states with shared geographic, historical, or economic ties.`)
  if (country.region && country.region !== e.subregion && country.region !== country.continent) {
    parts.push(`GlobeIQ groups it under "${country.region}" for the purposes of the game's regional hint.`)
  }
  return parts.join(' ')
}

function buildTravel(country, e) {
  const parts = []
  const bits = []
  if (country.capital) bits.push(`the capital, ${country.capital}`)
  if (e.timezones.length > 0) bits.push(e.timezones.length === 1 ? `the local time zone (${e.timezones[0]})` : `the relevant local time zone for their destination`)
  if (e.currencies.length > 0) bits.push(`the local currency (${e.currencies.map(c => c.name).join(' / ')})`)
  if (bits.length > 0) parts.push(`Visitors planning a trip to ${country.name} should familiarise themselves with ${bits.join(', ')}.`)
  if (e.callingCode) {
    parts.push(`The international dialling prefix is ${e.callingCode}, which is required when phoning a ${country.name} number from abroad.`)
  }
  if (e.drivingSide) {
    parts.push(`Vehicles drive on the ${e.drivingSide} side of the road, an important detail for anyone renting a car or crossing a land border by vehicle.`)
  }
  if (e.tld) {
    parts.push(`The country's top-level internet domain is ${e.tld}, used by local businesses, government sites, and many news organisations.`)
  }
  if (e.startOfWeek) {
    parts.push(`The working week traditionally starts on ${e.startOfWeek.charAt(0).toUpperCase() + e.startOfWeek.slice(1)}, which affects business hours, banking, and public holidays.`)
  }
  return parts.join(' ')
}

function buildAtlasTieIn(country) {
  const difficultyText = {
    easy: 'an easier opening puzzle for new players',
    medium: 'a moderately challenging puzzle, suited to players who already know the major continents',
    hard: 'a tougher puzzle reserved for geography fans who can pick up subtler hints',
  }[country.difficulty] || 'one of the 195 puzzles in the GlobeIQ rotation'
  const parts = []
  parts.push(`Inside the GlobeIQ game, ${country.name} appears as ${difficultyText}. When the daily puzzle selects this country, players progressively unlock six hints — silhouette, climate and terrain, number of land borders, region, "known for" tagline, and finally the capital city — before a flag reveal confirms the answer.`)
  if (country.personalityTags?.length > 0) {
    parts.push(`On its trophy card, ${country.name} carries the personality tags ${country.personalityTags.map(t => `“${t}”`).join(' and ')}, short flavour labels chosen to evoke the country's most recognisable cultural signatures.`)
  }
  parts.push(`Adding ${country.name} to your personal atlas is one of 195 small wins on the road to a complete world map. Each correctly guessed nation also contributes to your running streak and unlocks milestone celebrations at 10, 25, 50, 100, and 150 collected countries.`)
  return parts.join(' ')
}

// Standalone stylesheet for the prerendered content pages. Mirrors the app's
// "Aurora / Night-Globe" identity (Space Grotesk display + Inter body, deep
// navy with aurora washes, glassy cards, cyan→indigo→violet accent) so a
// visitor arriving from Google sees the same brand as the live game.
const STYLE = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{background:radial-gradient(1100px 560px at 12% -12%,rgba(56,189,248,0.10),transparent 60%),radial-gradient(1000px 620px at 112% 6%,rgba(168,85,247,0.10),transparent 55%),#070B14;background-attachment:fixed;color:#EEF1F8;font-family:'Inter',system-ui,-apple-system,sans-serif;font-size:16px;line-height:1.7;min-height:100vh;-webkit-font-smoothing:antialiased}
  header.ssg-header{display:flex;align-items:center;justify-content:space-between;padding:16px 24px;background:rgba(255,255,255,0.02);border-bottom:1px solid rgba(255,255,255,0.08);backdrop-filter:blur(8px);position:sticky;top:0;z-index:5}
  header.ssg-header a.brand{text-decoration:none;font-family:'Space Grotesk',system-ui,sans-serif;font-weight:700;font-size:20px;color:#EEF1F8;letter-spacing:-0.4px}
  header.ssg-header a.brand b{font-weight:700;background:linear-gradient(135deg,#38BDF8,#6366F1 52%,#A855F7);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
  header.ssg-header a.back{font-size:14px;color:#6B7488;text-decoration:none}
  header.ssg-header a.back:hover{color:#AEB6C8}
  main.ssg{max-width:760px;margin:32px auto;padding:0 24px 80px}
  .flag{font-size:72px;line-height:1;margin-bottom:8px;filter:drop-shadow(0 6px 16px rgba(0,0,0,0.4))}
  h1{font-family:'Space Grotesk',system-ui,sans-serif;font-size:34px;font-weight:700;color:#fff;letter-spacing:-0.8px;margin-bottom:6px}
  .meta{font-family:'Space Grotesk',system-ui,sans-serif;font-size:13px;color:#4DA3FF;margin-bottom:20px;text-transform:uppercase;letter-spacing:1.4px;font-weight:600}
  .badge{display:inline-block;font-size:11px;padding:3px 8px;border-radius:6px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px}
  .badge.collected{background:#10b98122;color:#34D399;border:1px solid #10b98144}
  .badge.locked{background:rgba(255,255,255,0.06);color:#6B7488;border:1px solid rgba(255,255,255,0.08)}
  section{margin-top:30px}
  h2{font-family:'Space Grotesk',system-ui,sans-serif;font-size:13px;font-weight:700;color:#4DA3FF;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:10px}
  p{color:#AEB6C8;font-size:15px;margin-bottom:12px}
  ul.facts{list-style:none;padding:0;display:grid;gap:8px}
  ul.facts li{display:flex;justify-content:space-between;gap:12px;background:rgba(255,255,255,0.035);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:11px 15px;font-size:14px}
  ul.facts li .k{color:#6B7488;font-weight:600}
  ul.facts li .v{color:#fff;text-align:right;font-weight:500}
  .neighbors{list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
  .neighbors li{display:inline-block}
  .neighbors a,.neighbors span{background:rgba(255,255,255,0.035);border:1px solid rgba(255,255,255,0.08);border-radius:999px;padding:5px 12px;font-size:12px;color:#AEB6C8;text-decoration:none}
  .neighbors a:hover{background:rgba(255,255,255,0.10);color:#fff}
  .cta{display:inline-block;margin-top:24px;background:linear-gradient(135deg,#4DA3FF,#6366F1);color:#fff;padding:13px 24px;border-radius:12px;font-weight:700;font-family:'Space Grotesk',system-ui,sans-serif;text-decoration:none;box-shadow:0 6px 20px rgba(77,163,255,0.3)}
  .cta:hover{filter:brightness(1.08)}
  nav.adj{display:flex;justify-content:space-between;gap:10px;margin-top:32px}
  nav.adj a{flex:1;background:rgba(255,255,255,0.035);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:11px 15px;color:#AEB6C8;font-size:13px;font-weight:600;text-decoration:none}
  nav.adj a:hover{background:rgba(255,255,255,0.10);color:#fff}
  nav.adj a.next{text-align:right}
  footer.ssg-footer{text-align:center;padding:28px;font-size:13px;color:#6B7488;border-top:1px solid rgba(255,255,255,0.08)}
  footer.ssg-footer a{color:#6B7488;text-decoration:none;margin:0 8px}
  footer.ssg-footer a:hover{color:#AEB6C8}
  ul.grid{list-style:none;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:7px;margin-top:14px}
  ul.grid li a{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,0.035);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:11px 13px;color:#AEB6C8;text-decoration:none;font-size:14px}
  ul.grid li a:hover{background:rgba(255,255,255,0.10);color:#fff}
  .flag-em{font-size:18px;line-height:1}
`

function renderCountryHtml(country, prev, next) {
  const e = getEnrichment(country)
  const slug = slugify(country.name)
  const canonical = `${SITE}/countries/${slug}`
  const title = `${country.name} — Capital, Flag, Geography & Country Facts | GlobeIQ`
  const description = `${country.name}: capital ${country.capital}, in ${country.continent}${e?.subregion ? ` (${e.subregion})` : ''}. ${country.knownFor}. Read country facts and play GlobeIQ to collect all 195 nations.`

  const placeSchema = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: country.name,
    description: country.knownFor,
    address: { '@type': 'PostalAddress', addressCountry: country.name, addressRegion: country.region },
    containedInPlace: { '@type': 'Place', name: country.continent },
  }
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'GlobeIQ', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Countries', item: `${SITE}/countries` },
      { '@type': 'ListItem', position: 3, name: country.name, item: canonical },
    ],
  }

  const facts = []
  facts.push(['🏙️ Capital', country.capital])
  if (e?.officialName && e.officialName !== country.name) facts.push(['📛 Official name', e.officialName])
  if (e?.nativeNames?.length > 0) facts.push(['🗣️ Native name', e.nativeNames.join(' · ')])
  if (e?.demonym) facts.push(['🧑 Demonym', e.demonym])
  facts.push(['📍 Region', country.region])
  if (e?.subregion) facts.push(['🌐 Subregion', e.subregion])
  if (e?.area) facts.push(['📐 Area', e.area])
  if (e?.populationPrecise) facts.push(['👥 Population', e.populationPrecise])
  facts.push(['🌡️ Climate', country.climate])
  facts.push(['🗺️ Land borders', String(country.borders)])
  if (e?.languages?.length > 0) facts.push([e.languages.length > 1 ? '💬 Languages' : '💬 Language', e.languages.join(', ')])
  if (e?.currencies?.length > 0) facts.push([
    e.currencies.length > 1 ? '💰 Currencies' : '💰 Currency',
    e.currencies.map(c => `${c.name}${c.symbol ? ` (${c.symbol})` : ''}`).join(', '),
  ])
  if (e?.callingCode) facts.push(['📞 Calling code', e.callingCode])
  if (e?.tld) facts.push(['🌐 Internet TLD', e.tld])
  if (e?.drivingSide) facts.push(['🚗 Drives on', `${e.drivingSide} side`])
  if (e?.timezones?.length > 0) facts.push([
    e.timezones.length > 1 ? '🕐 Time zones' : '🕐 Time zone',
    e.timezones.length > 3 ? `${e.timezones.slice(0,3).join(', ')} +${e.timezones.length-3} more` : e.timezones.join(', '),
  ])
  if (e?.unMember === true) facts.push(['🇺🇳 UN member', 'Yes'])
  if (e?.independent === false) facts.push(['🏛️ Status', 'Dependency / non-sovereign territory'])

  const overview = e ? buildOverview(country, e) : country.knownFor
  const geography = e ? buildGeography(country, e) : ''
  const people = e ? buildPeople(country, e) : ''
  const government = e ? buildGovernment(country, e) : ''
  const travel = e ? buildTravel(country, e) : ''
  const atlas = buildAtlasTieIn(country)

  const neighborsBlock = e?.neighbors?.length > 0
    ? `<section>
        <h2>Bordering countries</h2>
        <p>${esc(country.name)} shares land borders with ${e.neighbors.length} ${e.neighbors.length === 1 ? 'country' : 'countries'}. Click any neighbour to read about it:</p>
        <ul class="neighbors">
          ${e.neighbors.map(name => {
            const match = countries.find(c => c.name === name)
            return match
              ? `<li><a href="/countries/${slugify(match.name)}">${esc(name)}</a></li>`
              : `<li><span>${esc(name)}</span></li>`
          }).join('\n          ')}
        </ul>
      </section>`
    : ''

  const funFactBlock = country.funFact
    ? `<section>
        <h2>Did you know?</h2>
        <p>${esc(country.funFact)}</p>
      </section>`
    : ''

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <link rel="canonical" href="${canonical}" />
  <meta name="robots" content="index, follow" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${esc(country.name)} — GlobeIQ" />
  <meta property="og:description" content="${esc(country.knownFor)}. Capital: ${esc(country.capital)}." />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${SITE}/og/${slug}.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${esc(country.name)} on GlobeIQ — capital ${esc(country.capital)}, ${esc(country.continent)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(country.name)} — GlobeIQ" />
  <meta name="twitter:description" content="${esc(country.knownFor)}. Capital: ${esc(country.capital)}." />
  <meta name="twitter:image" content="${SITE}/og/${slug}.png" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" />
  <script type="application/ld+json">${jsonLd(placeSchema)}</script>
  <script type="application/ld+json">${jsonLd(breadcrumbSchema)}</script>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-8PQZKTB7KJ"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-8PQZKTB7KJ');</script>
  <style>${STYLE}</style>
</head>
<body>

<header class="ssg-header">
  <a class="brand" href="/">🌍 Globe<b>IQ</b></a>
  <a class="back" href="/">← Back to game</a>
</header>

<main class="ssg">
  <div class="flag" aria-hidden="true">${esc(country.flagEmoji)}</div>
  <h1>${esc(country.name)}</h1>
  <div class="meta">${esc(country.continent)} · ${esc(country.population)}</div>

  <section>
    <h2>About ${esc(country.name)}</h2>
    <p>${esc(overview)}</p>
  </section>

  ${geography ? `<section><h2>Geography &amp; climate</h2><p>${esc(geography)}</p></section>` : ''}

  ${people ? `<section><h2>People, language &amp; society</h2><p>${esc(people)}</p></section>` : ''}

  <section>
    <h2>Quick facts at a glance</h2>
    <ul class="facts">
      ${facts.map(([k, v]) => `<li><span class="k">${k}</span><span class="v">${esc(v)}</span></li>`).join('\n      ')}
    </ul>
  </section>

  ${travel ? `<section><h2>Practical travel &amp; daily-life info</h2><p>${esc(travel)}</p></section>` : ''}

  ${government ? `<section><h2>Government &amp; global standing</h2><p>${esc(government)}</p></section>` : ''}

  ${neighborsBlock}

  ${funFactBlock}

  <section>
    <h2>${esc(country.name)} in the GlobeIQ atlas</h2>
    <p>${esc(atlas)}</p>
  </section>

  <a class="cta" href="/">Play today's GlobeIQ puzzle →</a>

  <nav class="adj" aria-label="Adjacent countries">
    ${prev ? `<a href="/countries/${slugify(prev.name)}">◀ ${esc(prev.name)}</a>` : '<span></span>'}
    ${next ? `<a class="next" href="/countries/${slugify(next.name)}">${esc(next.name)} ▶</a>` : '<span></span>'}
  </nav>
</main>

<footer class="ssg-footer">
  <a href="/">Play</a> · <a href="/countries">All countries</a> · <a href="/about">About</a> · <a href="/how-to-play">How to play</a> · <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a> · <a href="/contact">Contact</a>
</footer>

</body>
</html>
`
}

function renderIndexHub(sorted) {
  const byContinent = {}
  for (const c of sorted) {
    if (!byContinent[c.continent]) byContinent[c.continent] = []
    byContinent[c.continent].push(c)
  }
  const continents = Object.keys(byContinent).sort()

  const sections = continents.map(cont => `
    <section>
      <h2>${esc(cont)} (${byContinent[cont].length} countries)</h2>
      <p>Browse every sovereign nation grouped under ${esc(cont)} on GlobeIQ. Each link opens a dedicated page with that country's capital, official name, languages, currency, area, population, time zones, and more.</p>
      <ul class="grid">
        ${byContinent[cont].map(c => `<li><a href="/countries/${slugify(c.name)}"><span class="flag-em">${esc(c.flagEmoji)}</span> ${esc(c.name)}</a></li>`).join('')}
      </ul>
    </section>
  `).join('')

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>All 195 Countries — Geography Reference | GlobeIQ</title>
  <meta name="description" content="Browse all 195 sovereign countries on GlobeIQ. Open any country for facts on its capital, climate, currency, languages, area, borders, time zones, and more." />
  <link rel="canonical" href="${SITE}/countries" />
  <meta name="robots" content="index, follow" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="All Countries — GlobeIQ" />
  <meta property="og:description" content="195 sovereign nations, grouped by continent. Click any country to see its capital, currency, languages, area, time zones, and more." />
  <meta property="og:url" content="${SITE}/countries" />
  <meta property="og:image" content="${SITE}/preview.png" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" />
  <style>${STYLE} main.ssg{max-width:1080px}</style>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-8PQZKTB7KJ"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-8PQZKTB7KJ');</script>
</head>
<body>

<header class="ssg-header">
  <a class="brand" href="/">🌍 Globe<b>IQ</b></a>
  <a class="back" href="/">← Back to game</a>
</header>

<main class="ssg">
  <h1>All 195 countries</h1>
  <div class="meta">${sorted.length} sovereign nations, grouped by continent.</div>
  <p>GlobeIQ tracks the 195 widely-recognised sovereign states of the modern world — the 193 UN member states plus the Holy See (Vatican City) and the State of Palestine, both of which hold UN observer status. Each country in our index links to a dedicated reference page covering its capital city, official and native names, primary languages, currency, land area, population, time zones, neighbouring countries, climate, and notable cultural or geographic features. Use the continent groupings below to explore regions you know well — or to discover the lesser-known nations that often appear as the trickiest puzzles in the daily game.</p>
  ${sections}
</main>

<footer class="ssg-footer">
  <a href="/">Play</a> · <a href="/about">About</a> · <a href="/how-to-play">How to play</a> · <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a> · <a href="/contact">Contact</a>
</footer>

</body>
</html>
`
}

// ─── Sitemap ────────────────────────────────────────────────────────────────
// Generated here (rather than hand-maintained in public/) so the URL set is
// always exactly the pages we actually ship — the homepage, the /countries
// hub, the five content pages, and one entry per sovereign nation — and can
// never drift out of sync with the country data or slugify().

function renderSitemap(sorted) {
  const staticPages = [
    { path: '', changefreq: 'daily', priority: '1.0', lastmod: TODAY },
    { path: 'countries', changefreq: 'weekly', priority: '0.8', lastmod: CONTENT_DATE },
    { path: 'how-to-play', changefreq: 'monthly', priority: '0.6', lastmod: gitDate('public/how-to-play.html') },
    { path: 'about', changefreq: 'monthly', priority: '0.5', lastmod: gitDate('public/about.html') },
    { path: 'contact', changefreq: 'yearly', priority: '0.3', lastmod: gitDate('public/contact.html') },
    { path: 'privacy', changefreq: 'yearly', priority: '0.3', lastmod: gitDate('public/privacy.html') },
    { path: 'terms', changefreq: 'yearly', priority: '0.3', lastmod: gitDate('public/terms.html') },
  ]

  const entries = [
    ...staticPages.map(p => ({ loc: `${SITE}/${p.path}`, ...p })),
    ...sorted.map(c => ({
      loc: `${SITE}/countries/${slugify(c.name)}`,
      lastmod: CONTENT_DATE, changefreq: 'monthly', priority: '0.7',
    })),
  ]

  const urls = entries.map(e => `  <url>
    <loc>${e.loc}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generated at build time by scripts/prerender.mjs — do not edit by hand. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
}

// ─── Homepage SEO content injection ─────────────────────────────────────────

function renderHomepageSeoBlock(sorted) {
  // Index countries grouped by continent for the browse-all section
  const byContinent = {}
  for (const c of sorted) {
    if (!byContinent[c.continent]) byContinent[c.continent] = []
    byContinent[c.continent].push(c)
  }
  const continents = Object.keys(byContinent).sort()

  const continentGrids = continents.map(cont => `
      <section class="seo-continent">
        <h3>${esc(cont)} <span class="seo-count">(${byContinent[cont].length})</span></h3>
        <ul class="seo-grid">
          ${byContinent[cont].map(c => `<li><a href="/countries/${slugify(c.name)}"><span class="seo-flag">${esc(c.flagEmoji)}</span> ${esc(c.name)}</a></li>`).join('')}
        </ul>
      </section>
  `).join('')

  return `
<div id="seo-content" style="background:#070B14;color:#AEB6C8;font-family:'Inter',system-ui,-apple-system,sans-serif;line-height:1.7;padding:48px 24px 80px;border-top:1px solid rgba(255,255,255,0.08)">
  <style>
    #seo-content .seo-inner{max-width:880px;margin:0 auto}
    #seo-content h2{font-family:'Space Grotesk',system-ui,sans-serif;font-size:25px;color:#fff;font-weight:700;margin:32px 0 12px;letter-spacing:-0.5px}
    #seo-content h3{font-family:'Space Grotesk',system-ui,sans-serif;font-size:16px;color:#4DA3FF;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin:18px 0 8px}
    #seo-content p{font-size:15px;margin:0 0 12px;color:#AEB6C8}
    #seo-content ul.seo-list{list-style:disc;padding-left:22px;margin:0 0 14px;color:#AEB6C8;font-size:15px}
    #seo-content ul.seo-list li{margin-bottom:6px}
    #seo-content .seo-grid{list-style:none;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:7px;margin:8px 0 16px}
    #seo-content .seo-grid li a{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,0.035);border:1px solid rgba(255,255,255,0.08);border-radius:9px;padding:9px 11px;color:#AEB6C8;text-decoration:none;font-size:14px}
    #seo-content .seo-grid li a:hover{background:rgba(255,255,255,0.10);color:#fff}
    #seo-content .seo-flag{font-size:18px}
    #seo-content .seo-count{color:#6B7488;font-size:13px;font-weight:600}
    #seo-content .seo-cta{display:inline-block;margin-top:14px;background:linear-gradient(135deg,#4DA3FF,#6366F1);color:#fff;padding:13px 24px;border-radius:12px;font-weight:700;font-family:'Space Grotesk',system-ui,sans-serif;text-decoration:none;box-shadow:0 6px 20px rgba(77,163,255,0.3)}
    #seo-content .seo-footer{margin-top:36px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;font-size:13px;color:#6B7488}
    #seo-content .seo-footer a{color:#6B7488;text-decoration:none;margin:0 8px}
  </style>

  <div class="seo-inner">

    <h2>What is GlobeIQ?</h2>
    <p>GlobeIQ is a free, daily geography guessing game in which one mystery country is selected from the 195 sovereign nations of the world, and your job is to identify it before running out of guesses. Each wrong guess unlocks one additional hint about the mystery country — its silhouette on the map, its climate and terrain, the number of land borders it shares, the broader world region it belongs to, what it's most famous for, and finally its capital city. A flag reveal seals the answer at the end.</p>
    <p>Unlike most quiz apps, GlobeIQ isn't about trivia speed. It rewards spatial reasoning, deduction, and slowly recalled fragments of school-day geography. A typical round takes one or two minutes, and every player worldwide gets the same daily country — so you can compare your guess pattern with friends without spoiling the answer.</p>

    <h2>How to play (the full rules)</h2>
    <p>You start each puzzle with seven guess slots. Type the name of any country into the input field and submit. If you're wrong, GlobeIQ tells you so and reveals the next hint in this order:</p>
    <ul class="seo-list">
      <li><strong>Hint 1 — Silhouette.</strong> A rough outline of the mystery country, scaled and centred. Some microstates show a spinning globe icon instead, signalling that the country is too small to render meaningfully at this scale.</li>
      <li><strong>Hint 2 — Climate &amp; terrain.</strong> A short description like "Tropical &amp; rainforest · Hot &amp; humid year-round" or "Arid desert · Hot days, cold nights".</li>
      <li><strong>Hint 3 — Land borders.</strong> The exact number of neighbouring countries that share a land border with the mystery nation. Island nations show "0".</li>
      <li><strong>Hint 4 — Region.</strong> A finer-grained location label, such as "West Africa", "Southern Cone", "Baltic States", or "Microstates" — narrower than just a continent.</li>
      <li><strong>Hint 5 — Known for.</strong> A one-line cultural tagline summarising what the country is most internationally recognised for — a famous landmark, a culinary tradition, an industry, or a historical legacy.</li>
      <li><strong>Hint 6 — Capital city.</strong> The capital's name. At this point most players have enough to lock in the right answer.</li>
      <li><strong>Reveal — Flag.</strong> If your seventh guess is still wrong, GlobeIQ shows the flag, the country name, and the day's fun fact.</li>
    </ul>
    <p>Every correct guess is added to your personal world atlas — a saved record of countries you've identified, viewable as a Pokédex-style modal grouped by continent. You can also opt in to a streak counter (consecutive daily wins), which celebrates milestones at 3, 7, 14, 30, and 100 days. Logged-in players have their atlas and streak data synced across devices via secure cloud storage.</p>

    <h2>Why play geography games?</h2>
    <p>Geography is one of those subjects almost everyone studied at some point and almost no-one keeps practising afterwards. The result is a slow drift: countries that were once obvious become surprisingly hard to place on a blank map, and recent geopolitical changes — new borders, renamed states, post-colonial independence — rarely get refreshed in adult memory. A short daily game is a low-pressure, low-friction way to keep this knowledge alive.</p>
    <p>There are also concrete cognitive benefits to engaging with maps regularly. Spatial reasoning is correlated with skills as varied as navigation, mental rotation, and even long-term recall of unrelated facts. Geography knowledge is widely used in news comprehension — understanding where a story takes place strongly improves how well people remember the story itself. And for travellers, even a passing familiarity with regions, time zones, capitals, and currencies takes the friction out of trip planning.</p>
    <p>GlobeIQ is designed for short, repeated sessions rather than long study marathons. The daily puzzle structure encourages a sustainable habit; the hint progression turns each round into a small reasoning exercise; and the atlas turns slow knowledge-building into a visible collection. Over a few months of daily play, most players notice meaningful improvement in their ability to place lesser-known countries — particularly in regions outside their home continent.</p>

    <h2>Browse all 195 countries</h2>
    <p>Every country GlobeIQ tracks has its own dedicated reference page with facts on its capital, official name, languages, currency, area, population, climate, time zones, neighbouring countries, and more. Use this index to jump directly to any country's page.</p>
    ${continentGrids}

    <h2>About this site</h2>
    <p>GlobeIQ is built and maintained as an independent project. All country facts are sourced from open public datasets (primarily REST Countries v3.1, sourced from the CIA World Factbook and similar public-domain references) and curated for clarity. The game's silhouettes are generated from the open-source <em>world-atlas</em> TopoJSON dataset. If you spot an inaccuracy or want to suggest a feature, see our <a href="/contact" style="color:#4DA3FF;text-decoration:none">contact page</a> — we read every message.</p>
    <p>For more detail on how the game works and how data is handled, see the dedicated <a href="/how-to-play" style="color:#4DA3FF;text-decoration:none">How to play</a>, <a href="/about" style="color:#4DA3FF;text-decoration:none">About</a>, <a href="/privacy" style="color:#4DA3FF;text-decoration:none">Privacy</a>, and <a href="/terms" style="color:#4DA3FF;text-decoration:none">Terms</a> pages.</p>

    <a class="seo-cta" href="/">▶ Play today's puzzle</a>

    <div class="seo-footer">
      <a href="/">Play</a> · <a href="/countries">All countries</a> · <a href="/about">About</a> · <a href="/how-to-play">How to play</a> · <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a> · <a href="/contact">Contact</a>
    </div>
  </div>
</div>
`
}

function injectHomepageSeo(shellHtml, sorted) {
  const block = renderHomepageSeoBlock(sorted)
  // Inject directly before </body> so the React app remains untouched at top.
  if (shellHtml.includes('</body>')) {
    return shellHtml.replace('</body>', `${block}\n</body>`)
  }
  // Fallback: append at end.
  return shellHtml + block
}

// ─── Cleanup of stale per-route subdirectories ─────────────────────────────
// A previous build pipeline (vite-prerender-plugin output, or older versions
// of this script) created dist/countries/{slug}/index.html files. They conflict
// with the new flat dist/countries/{slug}.html files when cleanUrls is on, and
// Vercel will prefer the directory variant. Remove them so the new rich
// content is what gets served.
function cleanStaleSubdirs() {
  const countriesDir = resolve(dist, 'countries')
  if (!existsSync(countriesDir)) return 0
  let removed = 0
  for (const entry of readdirSync(countriesDir)) {
    const full = resolve(countriesDir, entry)
    try {
      const s = statSync(full)
      if (s.isDirectory()) {
        rmSync(full, { recursive: true, force: true })
        removed++
      }
    } catch {}
  }
  return removed
}

// ──────────────────────────────────────────────────────────────────────────
// Main

const sorted = [...countries].sort((a, b) => a.name.localeCompare(b.name))
mkdirSync(resolve(dist, 'countries'), { recursive: true })

// Drop any stale {slug}/index.html dirs left by previous build pipelines.
const removedDirs = cleanStaleSubdirs()
if (removedDirs > 0) console.log(`Removed ${removedDirs} stale country subdirectories`)

let count = 0
for (let i = 0; i < sorted.length; i++) {
  const country = sorted[i]
  const prev = i > 0 ? sorted[i - 1] : null
  const next = i < sorted.length - 1 ? sorted[i + 1] : null
  const html = renderCountryHtml(country, prev, next)
  writeFileSync(resolve(dist, 'countries', `${slugify(country.name)}.html`), html)
  count++
}

writeFileSync(resolve(dist, 'countries', 'index.html'), renderIndexHub(sorted))

// Generate the sitemap from the same data the pages are built from, so it is
// always in sync with what actually ships.
writeFileSync(resolve(dist, 'sitemap.xml'), renderSitemap(sorted))

// Inject the rich SEO block into dist/index.html for the homepage.
const indexShell = readFileSync(resolve(dist, 'index.html'), 'utf-8')
const enrichedIndex = injectHomepageSeo(indexShell, sorted)
writeFileSync(resolve(dist, 'index.html'), enrichedIndex)

console.log(`Pre-rendered ${count} country pages + 1 index hub + sitemap (${count + 7} urls) + beefed homepage at dist/`)
