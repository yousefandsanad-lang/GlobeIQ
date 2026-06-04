// Build-time Open Graph image generator.
//
// Produces 1200×630 PNG social-share cards using satori (HTML/flexbox → SVG)
// + @resvg/resvg-js (SVG → PNG) — the same engine behind @vercel/og, but run
// at build time so the output is static and CDN-cacheable.
//
//   dist/preview.png        — the default card (homepage, results, fallback)
//   dist/og/{slug}.png      — one branded card per country
//
// Fonts are loaded from @fontsource packages (devDependencies), so this works
// on the Vercel Linux build with no system fonts and no network dependency.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { default as countries } from '../src/data/countries.js'
import { slugify } from '../src/utils/slug.js'
import { getContinentTheme } from '../src/utils/continentTheme.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const dist = resolve(root, 'dist')

const fontDir = resolve(root, 'node_modules/@fontsource')
const fonts = [
  { name: 'Space Grotesk', weight: 700, style: 'normal', data: readFileSync(resolve(fontDir, 'space-grotesk/files/space-grotesk-latin-700-normal.woff')) },
  { name: 'Inter', weight: 400, style: 'normal', data: readFileSync(resolve(fontDir, 'inter/files/inter-latin-400-normal.woff')) },
  { name: 'Inter', weight: 600, style: 'normal', data: readFileSync(resolve(fontDir, 'inter/files/inter-latin-600-normal.woff')) },
]

const W = 1200
const H = 630
const BG = '#070B14'
const AURORA =
  'radial-gradient(900px 520px at 8% -10%, rgba(56,189,248,0.22), transparent 60%),' +
  'radial-gradient(900px 560px at 105% 8%, rgba(168,85,247,0.22), transparent 55%),' +
  'radial-gradient(800px 600px at 50% 130%, rgba(99,102,241,0.18), transparent 60%)'

// Minimal hyperscript for satori (no JSX in a plain .mjs build script).
function h(type, props = {}, ...children) {
  const kids = children.flat().filter(c => c !== null && c !== undefined && c !== false)
  return { type, props: { ...props, children: kids.length === 0 ? undefined : kids.length === 1 ? kids[0] : kids } }
}

function brandMark(fontSize = 38) {
  return h('div', { style: { display: 'flex', alignItems: 'center', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize, letterSpacing: '-0.5px' } },
    h('div', { style: { color: '#EEF1F8' } }, 'Globe'),
    h('div', { style: { backgroundImage: 'linear-gradient(135deg, #38BDF8, #6366F1 55%, #A855F7)', backgroundClip: 'text', color: 'transparent' } }, 'IQ'),
  )
}

function frame(children, accent = '#4DA3FF') {
  return h('div', {
    style: {
      width: W, height: H, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      padding: '72px 80px', backgroundColor: BG, backgroundImage: AURORA,
      fontFamily: 'Inter', color: '#EEF1F8', position: 'relative',
    },
  },
    // Accent hairline along the top
    h('div', { style: { position: 'absolute', top: 0, left: 0, right: 0, height: 8, backgroundImage: `linear-gradient(90deg, ${accent}, #6366F1, #A855F7)` } }),
    ...children,
  )
}

function defaultCard() {
  return frame([
    h('div', { style: { display: 'flex', flexDirection: 'column' } },
      h('div', { style: { display: 'flex', fontFamily: 'Inter', fontWeight: 600, fontSize: 24, letterSpacing: '4px', color: '#4DA3FF', textTransform: 'uppercase' } }, 'Geography guessing game'),
      h('div', { style: { display: 'flex', alignItems: 'baseline', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 150, letterSpacing: '-4px', marginTop: 8 } },
        h('div', { style: { color: '#fff' } }, 'Globe'),
        h('div', { style: { backgroundImage: 'linear-gradient(135deg, #38BDF8, #6366F1 55%, #A855F7)', backgroundClip: 'text', color: 'transparent' } }, 'IQ'),
      ),
    ),
    h('div', { style: { display: 'flex', maxWidth: 880, fontSize: 40, lineHeight: 1.35, color: '#AEB6C8', fontWeight: 400 } },
      'Guess the mystery country from six hints — then collect all 195 in your personal world atlas.'),
    h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
      h('div', { style: { display: 'flex', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 34, color: '#fff' } }, 'globeiq.app'),
      h('div', { style: { display: 'flex', fontSize: 26, color: '#6B7488', fontWeight: 600 } }, 'Free  ·  No login  ·  195 countries'),
    ),
  ])
}

function countryCard(country) {
  const theme = getContinentTheme(country.continent)
  const accent = theme.primary
  return frame([
    h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
      brandMark(36),
      h('div', { style: { display: 'flex', fontFamily: 'Inter', fontWeight: 600, fontSize: 22, letterSpacing: '2px', color: accent, textTransform: 'uppercase' } }, country.continent),
    ),
    h('div', { style: { display: 'flex', flexDirection: 'column' } },
      h('div', { style: { display: 'flex', alignItems: 'center' } },
        h('div', { style: { width: 14, height: 96, borderRadius: 8, backgroundColor: accent, marginRight: 28, boxShadow: `0 0 40px ${accent}` } }),
        h('div', { style: { display: 'flex', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: country.name.length > 18 ? 78 : 104, letterSpacing: '-2px', color: '#fff' } }, country.name),
      ),
      h('div', { style: { display: 'flex', fontSize: 34, color: '#AEB6C8', marginTop: 24, marginLeft: 42 } },
        [country.capital ? `Capital: ${country.capital}` : null, country.region].filter(Boolean).join('   ·   ')),
    ),
    h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
      h('div', { style: { display: 'flex', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 30, color: '#fff' } }, 'Play at globeiq.app'),
      h('div', { style: { display: 'flex', fontSize: 24, color: '#6B7488', fontWeight: 600 } }, 'Can you guess it?'),
    ),
  ], accent)
}

async function renderPng(node) {
  const svg = await satori(node, { width: W, height: H, fonts })
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render().asPng()
  return png
}

async function main() {
  mkdirSync(resolve(dist, 'og'), { recursive: true })

  // Default card → dist/preview.png
  writeFileSync(resolve(dist, 'preview.png'), await renderPng(defaultCard()))

  // Per-country cards → dist/og/{slug}.png
  let n = 0
  for (const country of countries) {
    const png = await renderPng(countryCard(country))
    writeFileSync(resolve(dist, 'og', `${slugify(country.name)}.png`), png)
    n++
  }

  console.log(`Generated OG images: dist/preview.png + ${n} country cards in dist/og/`)
}

main().catch(err => {
  console.error('OG generation failed:', err)
  process.exit(1)
})
