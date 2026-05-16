// One-time enrichment fetcher: pulls factual data from REST Countries v3.1
// for every country in src/data/countries.js and writes a JSON file the
// CountryPage and prerender script consume at build time.
//
// Run: node scripts/fetch-country-enrichment.mjs
// Output: src/data/countries-enrichment.json

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const countriesSrc = readFileSync(resolve(root, 'src/data/countries.js'), 'utf-8')

// Pull the id field from every country block. We rely on ISO numeric codes
// matching REST Countries' ccn3 endpoint.
const ids = [...countriesSrc.matchAll(/id:\s*"([0-9]+)"/g)].map(m => m[1])
console.log(`Found ${ids.length} country ids in countries.js`)

const FIELDS = [
  'cca2','cca3','ccn3','name','capital','region','subregion',
  'currencies','languages','area','population','borders',
  'timezones','idd','car','tld','latlng','demonyms','startOfWeek',
  'unMember','independent',
].join(',')

async function fetchOne(numeric) {
  const url = `https://restcountries.com/v3.1/alpha/${numeric}?fields=${FIELDS}`
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err) {
      if (attempt === 2) throw err
      await new Promise(r => setTimeout(r, 500 * (attempt + 1)))
    }
  }
}

const enrichment = {}
let i = 0
for (const id of ids) {
  i++
  try {
    const data = await fetchOne(id)
    enrichment[id] = data
    if (i % 20 === 0 || i === ids.length) console.log(`  ${i}/${ids.length} fetched`)
  } catch (err) {
    console.warn(`  Failed ${id}: ${err.message}`)
    enrichment[id] = null
  }
}

const outPath = resolve(root, 'src/data/countries-enrichment.json')
writeFileSync(outPath, JSON.stringify(enrichment, null, 2))
console.log(`\nWrote ${outPath}`)
console.log(`Hit: ${Object.values(enrichment).filter(Boolean).length}/${ids.length}`)
