import enrichmentByNumeric from '../data/countries-enrichment.json'

// Build a cca3 -> common name map once, used to resolve `borders: ['GRC',...]`
const NAME_BY_CCA3 = (() => {
  const m = {}
  for (const data of Object.values(enrichmentByNumeric)) {
    if (data?.cca3 && data?.name?.common) m[data.cca3] = data.name.common
  }
  return m
})()

function formatArea(km2) {
  if (typeof km2 !== 'number') return null
  if (km2 >= 1_000_000) return `${(km2 / 1_000_000).toFixed(2)}M km²`
  if (km2 >= 10_000) return `${Math.round(km2 / 1000).toLocaleString()},000 km²`.replace(',000,000', 'M')
  return `${km2.toLocaleString()} km²`
}

function formatPopulation(p) {
  if (typeof p !== 'number') return null
  if (p >= 1_000_000) return `${(p / 1_000_000).toFixed(p >= 100_000_000 ? 0 : 1)} million`
  if (p >= 1_000) return `${Math.round(p / 1000).toLocaleString()} thousand`
  return p.toLocaleString()
}

function formatCurrencies(currencies) {
  if (!currencies) return []
  return Object.entries(currencies).map(([code, info]) => ({
    code,
    name: info?.name ?? code,
    symbol: info?.symbol ?? null,
  }))
}

function formatLanguages(languages) {
  if (!languages) return []
  return Object.values(languages)
}

function formatCallingCode(idd) {
  if (!idd?.root) return null
  const suffix = (idd.suffixes && idd.suffixes.length === 1) ? idd.suffixes[0] : ''
  return `${idd.root}${suffix}`
}

function formatNeighbors(borders) {
  if (!Array.isArray(borders) || borders.length === 0) return []
  return borders.map(code => NAME_BY_CCA3[code] ?? code)
}

export function getEnrichment(country) {
  const raw = enrichmentByNumeric[country.id]
  if (!raw) return null

  return {
    officialName: raw.name?.official ?? null,
    nativeNames: raw.name?.nativeName
      ? Object.values(raw.name.nativeName).map(n => n.common).filter(Boolean)
      : [],
    iso2: raw.cca2 ?? null,
    iso3: raw.cca3 ?? null,
    subregion: raw.subregion ?? null,
    area: formatArea(raw.area),
    areaRaw: raw.area ?? null,
    populationPrecise: formatPopulation(raw.population),
    populationRaw: raw.population ?? null,
    currencies: formatCurrencies(raw.currencies),
    languages: formatLanguages(raw.languages),
    callingCode: formatCallingCode(raw.idd),
    tld: Array.isArray(raw.tld) ? raw.tld[0] : null,
    timezones: Array.isArray(raw.timezones) ? raw.timezones : [],
    drivingSide: raw.car?.side ?? null,
    neighbors: formatNeighbors(raw.borders),
    demonym: raw.demonyms?.eng?.m ?? null,
    independent: raw.independent ?? null,
    unMember: raw.unMember ?? null,
    latlng: raw.latlng ?? null,
  }
}
