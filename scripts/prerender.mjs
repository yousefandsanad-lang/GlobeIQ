// Post-build pre-renderer.
// Reads dist/index.html (the Vite SPA shell) and the country data, then writes
// a fully-rendered static HTML file for every country at:
//   dist/countries/{slug}.html
// Plus an index hub at dist/countries/index.html that links to all 195.
//
// Vercel serves these static files in preference to the SPA fallback rewrite
// (filesystem matches always win over rewrites), so Googlebot and AdSense
// see real content while in-app React-Router navigation still works.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { default as countries } from '../src/data/countries.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const dist = resolve(root, 'dist')

const enrichmentRaw = JSON.parse(readFileSync(resolve(root, 'src/data/countries-enrichment.json'), 'utf-8'))
const shell = readFileSync(resolve(dist, 'index.html'), 'utf-8')

const SITE = 'https://globeiq.app'

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]))
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
    populationPrecise: formatPopulation(raw.population),
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
  }
}

function buildOverview(country, e) {
  const parts = []
  const official = e.officialName && e.officialName !== country.name ? `, officially the ${e.officialName},` : ''
  parts.push(`${country.name}${official} is a country in ${country.continent}${e.subregion ? `, specifically in the ${e.subregion} subregion` : ''}.`)
  if (country.capital) parts.push(`Its capital is ${country.capital}${e.populationPrecise ? `, and the country is home to roughly ${e.populationPrecise} people` : ''}.`)
  if (e.languages.length > 0) {
    const lang = e.languages.length === 1
      ? `${e.languages[0]} is the main language spoken`
      : `${e.languages.slice(0, -1).join(', ')} and ${e.languages.at(-1)} are the main languages spoken`
    parts.push(`${lang} in ${country.name}.`)
  }
  if (e.currencies.length > 0) {
    const c = e.currencies[0]
    parts.push(`The official currency is the ${c.name}${c.symbol ? ` (${c.symbol})` : ''}.`)
  }
  parts.push(country.knownFor + (country.knownFor.endsWith('.') ? '' : '.'))
  return parts.join(' ')
}

function buildGeography(country, e) {
  const parts = []
  if (e.area) parts.push(`${country.name} covers approximately ${e.area} of land area.`)
  if (country.borders === 0) parts.push(`It is an island nation with no land borders.`)
  else if (country.borders === 1) parts.push(`It shares a single land border with one neighboring country.`)
  else if (country.borders > 1) parts.push(`It shares land borders with ${country.borders} neighboring countries.`)
  if (e.timezones.length > 0) {
    parts.push(e.timezones.length === 1
      ? `Standard time follows ${e.timezones[0]}.`
      : `The country spans ${e.timezones.length} time zones, ranging from ${e.timezones[0]} to ${e.timezones.at(-1)}.`)
  }
  if (country.climate) parts.push(`The climate is best described as: ${country.climate.toLowerCase().replace(/·/g, 'with')}.`)
  if (e.drivingSide) parts.push(`Traffic drives on the ${e.drivingSide} side of the road${e.callingCode ? `, and the international calling code is ${e.callingCode}` : ''}.`)
  return parts.join(' ')
}

const STYLE = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{background:#0A0E1A;color:#e0e0e0;font-family:system-ui,-apple-system,sans-serif;font-size:16px;line-height:1.7;min-height:100vh}
  header.ssg-header{display:flex;align-items:center;justify-content:space-between;padding:16px 24px;background:#ffffff08;border-bottom:1px solid #ffffff12}
  header.ssg-header a.brand{text-decoration:none;color:#4A90D9;font-weight:700;font-size:20px}
  header.ssg-header a.back{font-size:14px;color:#888;text-decoration:none}
  main.ssg{max-width:720px;margin:32px auto;padding:0 24px 80px}
  .flag{font-size:72px;line-height:1;margin-bottom:8px}
  h1{font-size:32px;font-weight:800;color:#fff;letter-spacing:-0.5px;margin-bottom:6px}
  .meta{font-size:14px;color:#888;margin-bottom:20px}
  .badge{display:inline-block;font-size:11px;padding:3px 8px;border-radius:6px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px}
  .badge.collected{background:#10b98122;color:#10b981;border:1px solid #10b98144}
  .badge.locked{background:#ffffff10;color:#888;border:1px solid #ffffff15}
  section{margin-top:28px}
  h2{font-size:13px;font-weight:700;color:#4A90D9;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:10px}
  p{color:#cfd3dd;font-size:15px;margin-bottom:10px}
  ul.facts{list-style:none;padding:0;display:grid;gap:8px}
  ul.facts li{display:flex;justify-content:space-between;gap:12px;background:#ffffff06;border:1px solid #ffffff10;border-radius:10px;padding:10px 14px;font-size:14px}
  ul.facts li .k{color:#888;font-weight:600}
  ul.facts li .v{color:#fff;text-align:right}
  .neighbors{list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
  .neighbors li{display:inline-block}
  .neighbors a,.neighbors span{background:#ffffff08;border:1px solid #ffffff15;border-radius:999px;padding:4px 10px;font-size:12px;color:#ddd;text-decoration:none}
  .neighbors a:hover{background:#ffffff15;color:#fff}
  .cta{display:inline-block;margin-top:24px;background:#4A90D9;color:#fff;padding:12px 22px;border-radius:10px;font-weight:700;text-decoration:none}
  .cta:hover{background:#5aa0e9}
  nav.adj{display:flex;justify-content:space-between;gap:10px;margin-top:32px}
  nav.adj a{flex:1;background:#ffffff08;border:1px solid #ffffff15;border-radius:10px;padding:10px 14px;color:#ccc;font-size:13px;font-weight:600;text-decoration:none}
  nav.adj a:hover{background:#ffffff12;color:#fff}
  nav.adj a.next{text-align:right}
  footer.ssg-footer{text-align:center;padding:24px;font-size:13px;color:#555;border-top:1px solid #ffffff0a}
  footer.ssg-footer a{color:#888;text-decoration:none;margin:0 8px}
  footer.ssg-footer a:hover{color:#ccc}
`

function renderCountryHtml(country, prev, next) {
  const e = getEnrichment(country)
  const slug = slugify(country.name)
  const canonical = `${SITE}/countries/${slug}`
  const title = `${country.name} — Flag, Capital, Region & Facts | GlobeIQ`
  const description = `${country.name}: capital ${country.capital}, in ${country.continent}${e?.subregion ? ` (${e.subregion})` : ''}. ${country.knownFor}. Play GlobeIQ to collect all 195 countries.`

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

  const overview = e ? buildOverview(country, e) : country.knownFor
  const geography = e ? buildGeography(country, e) : ''

  const neighborsBlock = e?.neighbors?.length > 0
    ? `<section>
        <h2>Bordering countries</h2>
        <p>${esc(country.name)} shares land borders with ${e.neighbors.length} ${e.neighbors.length === 1 ? 'country' : 'countries'}:</p>
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
  <meta property="og:image" content="${SITE}/preview.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(country.name)} — GlobeIQ" />
  <meta name="twitter:description" content="${esc(country.knownFor)}. Capital: ${esc(country.capital)}." />
  <meta name="twitter:image" content="${SITE}/preview.png" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <script type="application/ld+json">${JSON.stringify(placeSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6930930871941912" crossorigin="anonymous"></script>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-8PQZKTB7KJ"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-8PQZKTB7KJ');</script>
  <style>${STYLE}</style>
</head>
<body>

<header class="ssg-header">
  <a class="brand" href="/">🌍 GlobeIQ</a>
  <a class="back" href="/">← Back to game</a>
</header>

<main class="ssg">
  <div class="flag" aria-hidden="true">${country.flagEmoji}</div>
  <h1>${esc(country.name)}</h1>
  <div class="meta">${esc(country.continent)} · ${esc(country.population)}</div>

  <section>
    <h2>About ${esc(country.name)}</h2>
    <p>${esc(overview)}</p>
    ${geography ? `<p>${esc(geography)}</p>` : ''}
  </section>

  <section>
    <h2>Quick facts</h2>
    <ul class="facts">
      ${facts.map(([k, v]) => `<li><span class="k">${k}</span><span class="v">${esc(v)}</span></li>`).join('\n      ')}
    </ul>
  </section>

  ${funFactBlock}
  ${neighborsBlock}

  <a class="cta" href="/">Play today's puzzle →</a>

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
      <h2>${esc(cont)}</h2>
      <ul class="grid">
        ${byContinent[cont].map(c => `<li><a href="/countries/${slugify(c.name)}"><span class="flag-em">${c.flagEmoji}</span> ${esc(c.name)}</a></li>`).join('')}
      </ul>
    </section>
  `).join('')

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>All Countries — GlobeIQ</title>
  <meta name="description" content="Browse all 195 countries on GlobeIQ. Open any country for facts on its capital, climate, currency, languages, area, borders, time zones, and more." />
  <link rel="canonical" href="${SITE}/countries" />
  <meta name="robots" content="index, follow" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="All Countries — GlobeIQ" />
  <meta property="og:description" content="195 countries, grouped by continent. Click any to see capital, currency, languages, area, and more." />
  <meta property="og:url" content="${SITE}/countries" />
  <meta property="og:image" content="${SITE}/preview.png" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <style>${STYLE}
    ul.grid{list-style:none;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:6px}
    ul.grid li a{display:flex;align-items:center;gap:8px;background:#ffffff06;border:1px solid #ffffff10;border-radius:8px;padding:10px 12px;color:#ddd;text-decoration:none;font-size:14px}
    ul.grid li a:hover{background:#ffffff12;color:#fff}
    .flag-em{font-size:18px;line-height:1}
    main.ssg{max-width:1080px}
  </style>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-8PQZKTB7KJ"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-8PQZKTB7KJ');</script>
</head>
<body>

<header class="ssg-header">
  <a class="brand" href="/">🌍 GlobeIQ</a>
  <a class="back" href="/">← Back to game</a>
</header>

<main class="ssg">
  <h1>All countries</h1>
  <div class="meta">${sorted.length} sovereign nations, grouped by continent.</div>
  ${sections}
</main>

<footer class="ssg-footer">
  <a href="/">Play</a> · <a href="/about">About</a> · <a href="/how-to-play">How to play</a> · <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a> · <a href="/contact">Contact</a>
</footer>

</body>
</html>
`
}

// ──────────────────────────────────────────────────────────────────────────
// Main

const sorted = [...countries].sort((a, b) => a.name.localeCompare(b.name))
mkdirSync(resolve(dist, 'countries'), { recursive: true })

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

console.log(`Pre-rendered ${count} country pages + 1 index hub at dist/countries/`)
