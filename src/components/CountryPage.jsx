import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import Silhouette from './Silhouette'
import AdSlot from './AdSlot'
import { ADSTERRA } from '../utils/adSlots'
import { getContinentTheme } from '../utils/continentTheme'
import { findCountryBySlug, slugify } from '../utils/slug'
import { getEnrichment } from '../utils/countryEnrichment'

const SITE_URL = 'https://globeiq.app'

export default function CountryPage({ allCountries, collectedCountries }) {
  const { slug } = useParams()
  const navigate = useNavigate()

  const country = findCountryBySlug(allCountries, slug)

  const sortedCountries = useMemo(
    () => [...allCountries].sort((a, b) => a.name.localeCompare(b.name)),
    [allCountries]
  )

  const collectedSet = useMemo(
    () => new Set(collectedCountries.map(String)),
    [collectedCountries]
  )

  const collected = country ? collectedSet.has(String(country.id)) : false

  const index = country ? sortedCountries.findIndex(c => c.id === country.id) : -1
  const prev = index > 0 ? sortedCountries[index - 1] : null
  const next = index >= 0 && index < sortedCountries.length - 1 ? sortedCountries[index + 1] : null

  if (!country) {
    return (
      <main className="country-page country-not-found">
        <Helmet>
          <title>Country not found — GlobeIQ</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <button className="country-back" onClick={() => navigate('/')}>← Back to game</button>
        <h1 className="country-name">Country not found</h1>
        <p className="country-locked-message">
          We don't have a country at this URL. Try opening it from your atlas.
        </p>
        <Link to="/" className="country-cta">Play today's puzzle →</Link>
      </main>
    )
  }

  const theme = getContinentTheme(country.continent)
  const enrichment = getEnrichment(country)
  const canonical = `${SITE_URL}/countries/${slugify(country.name)}`
  // Keep this in sync with the prerendered title in scripts/prerender.mjs so a
  // page reached via SPA navigation matches the crawler-indexed static HTML.
  const title = `${country.name} — Capital, Flag, Geography & Country Facts | GlobeIQ`
  const description = `${country.name}: capital ${country.capital}, in ${country.continent} (${country.region}). ${country.knownFor}. Play GlobeIQ to collect all 195 countries.`
  const ogDescription = `${country.knownFor}. Capital: ${country.capital}.`

  const placeSchema = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: country.name,
    description: country.knownFor,
    address: {
      '@type': 'PostalAddress',
      addressCountry: country.name,
      addressRegion: country.region,
    },
    containedInPlace: {
      '@type': 'Place',
      name: country.continent,
    },
  }

  const ogImage = `${SITE_URL}/og/${slugify(country.name)}.png`

  // 3-item breadcrumb (GlobeIQ → Countries → Country) — kept identical to the
  // prerendered page so hydration doesn't change the structured data.
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'GlobeIQ', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Countries', item: `${SITE_URL}/countries` },
      { '@type': 'ListItem', position: 3, name: country.name, item: canonical },
    ],
  }

  return (
    <main className="country-page" style={{ '--country-accent': theme.primary }}>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={`${country.name} — GlobeIQ`} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${country.name} — GlobeIQ`} />
        <meta name="twitter:description" content={ogDescription} />
        <meta name="twitter:image" content={ogImage} />
        <script type="application/ld+json">{JSON.stringify(placeSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      <button className="country-back" onClick={() => navigate(-1)}>← Back</button>

      <div className="country-flag-row">
        <div className="country-flag">{country.flagEmoji}</div>
        <h1 className="country-name">{country.name}</h1>
        <div className="country-meta">
          {country.continent} · {country.population}
        </div>
        <div className={`country-collected-badge ${collected ? 'is-collected' : 'is-uncollected'}`}>
          {collected ? '✅ Collected' : '🔒 Not yet collected'}
        </div>
      </div>

      <div className="country-silhouette">
        <Silhouette
          continent={country.continent}
          revealed={true}
          countryName={country.name}
          countryId={country.id}
          flagEmoji={country.flagEmoji}
        />
      </div>

      <div className="country-facts">
        <FactRow icon="🏙️" label="Capital" value={country.capital} />
        <FactRow icon="🌡️" label="Climate" value={country.climate} />
        <FactRow icon="🗺️" label="Borders" value={String(country.borders)} />
        <FactRow icon="📍" label="Region" value={country.region} />
        <FactRow icon="🏆" label="Known for" value={country.knownFor} />
      </div>

      {country.funFact && (
        <div className="country-funfact">
          <div className="country-funfact-label">Did you know?</div>
          <div className="country-funfact-text">{country.funFact}</div>
        </div>
      )}

      {enrichment && (
        <>
          <section className="country-section">
            <h2 className="country-section-title">About {country.name}</h2>
            <p className="country-section-body">
              {buildOverviewParagraph(country, enrichment)}
            </p>
            <p className="country-section-body">
              {buildGeographyParagraph(country, enrichment)}
            </p>
          </section>

          <section className="country-section">
            <h2 className="country-section-title">Quick facts</h2>
            <div className="country-facts">
              {enrichment.officialName && enrichment.officialName !== country.name && (
                <FactRow icon="📛" label="Official name" value={enrichment.officialName} />
              )}
              {enrichment.nativeNames.length > 0 && (
                <FactRow icon="🗣️" label="Native name" value={enrichment.nativeNames.join(' · ')} />
              )}
              {enrichment.demonym && (
                <FactRow icon="🧑" label="Demonym" value={enrichment.demonym} />
              )}
              {enrichment.subregion && (
                <FactRow icon="🌐" label="Subregion" value={enrichment.subregion} />
              )}
              {enrichment.area && (
                <FactRow icon="📐" label="Area" value={enrichment.area} />
              )}
              {enrichment.populationPrecise && (
                <FactRow icon="👥" label="Population" value={enrichment.populationPrecise} />
              )}
              {enrichment.languages.length > 0 && (
                <FactRow icon="💬" label={enrichment.languages.length > 1 ? 'Languages' : 'Language'} value={enrichment.languages.join(', ')} />
              )}
              {enrichment.currencies.length > 0 && (
                <FactRow
                  icon="💰"
                  label={enrichment.currencies.length > 1 ? 'Currencies' : 'Currency'}
                  value={enrichment.currencies.map(c => `${c.name}${c.symbol ? ` (${c.symbol})` : ''}`).join(', ')}
                />
              )}
              {enrichment.callingCode && (
                <FactRow icon="📞" label="Calling code" value={enrichment.callingCode} />
              )}
              {enrichment.tld && (
                <FactRow icon="🌐" label="Internet TLD" value={enrichment.tld} />
              )}
              {enrichment.drivingSide && (
                <FactRow icon="🚗" label="Drives on the" value={`${enrichment.drivingSide} side`} />
              )}
              {enrichment.timezones.length > 0 && (
                <FactRow
                  icon="🕐"
                  label={enrichment.timezones.length > 1 ? 'Time zones' : 'Time zone'}
                  value={enrichment.timezones.length > 3 ? `${enrichment.timezones.slice(0, 3).join(', ')} +${enrichment.timezones.length - 3} more` : enrichment.timezones.join(', ')}
                />
              )}
            </div>
          </section>

          {enrichment.neighbors.length > 0 && (
            <section className="country-section">
              <h2 className="country-section-title">Bordering countries</h2>
              <p className="country-section-body">
                {country.name} shares land borders with {enrichment.neighbors.length} {enrichment.neighbors.length === 1 ? 'country' : 'countries'}:
              </p>
              <ul className="country-neighbors">
                {enrichment.neighbors.map(name => {
                  const match = allCountries.find(c => c.name === name)
                  return (
                    <li key={name}>
                      {match ? <Link to={`/countries/${slugify(match.name)}`}>{name}</Link> : name}
                    </li>
                  )
                })}
              </ul>
            </section>
          )}
        </>
      )}

      <Link to="/" className="country-cta">Play today's puzzle →</Link>

      <div style={{ width: '100%', maxWidth: 640, margin: '24px auto 0' }}>
        <AdSlot unit={ADSTERRA.countryPage} />
      </div>

      <nav className="country-nav" aria-label="Adjacent countries">
        {prev ? (
          <Link to={`/countries/${slugify(prev.name)}`} className="country-nav-link country-nav-prev">
            <span className="country-nav-arrow">◀</span>
            <span className="country-nav-label">{prev.name}</span>
          </Link>
        ) : <span />}
        {next ? (
          <Link to={`/countries/${slugify(next.name)}`} className="country-nav-link country-nav-next">
            <span className="country-nav-label">{next.name}</span>
            <span className="country-nav-arrow">▶</span>
          </Link>
        ) : <span />}
      </nav>
    </main>
  )
}

function FactRow({ icon, label, value }) {
  return (
    <div className="country-fact">
      <span className="country-fact-key"><span aria-hidden="true">{icon}</span> {label}</span>
      <span className="country-fact-value">{value}</span>
    </div>
  )
}

function buildOverviewParagraph(country, e) {
  const parts = []
  const official = e.officialName && e.officialName !== country.name
    ? `, officially the ${e.officialName},`
    : ''
  parts.push(`${country.name}${official} is a country in ${country.continent}${e.subregion ? `, specifically in the ${e.subregion} subregion` : ''}.`)
  if (country.capital) {
    parts.push(`Its capital is ${country.capital}${e.populationPrecise ? `, and the country is home to roughly ${e.populationPrecise} people` : ''}.`)
  }
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

function buildGeographyParagraph(country, e) {
  const parts = []
  if (e.area) {
    parts.push(`${country.name} covers approximately ${e.area} of land area.`)
  }
  if (country.borders === 0) {
    parts.push(`It is an island nation with no land borders.`)
  } else if (country.borders === 1) {
    parts.push(`It shares a single land border with one neighboring country.`)
  } else if (country.borders > 1) {
    parts.push(`It shares land borders with ${country.borders} neighboring countries.`)
  }
  if (e.timezones.length > 0) {
    parts.push(e.timezones.length === 1
      ? `Standard time follows ${e.timezones[0]}.`
      : `The country spans ${e.timezones.length} time zones, ranging from ${e.timezones[0]} to ${e.timezones.at(-1)}.`)
  }
  if (country.climate) {
    parts.push(`The climate is best described as: ${country.climate.toLowerCase().replace(/·/g, 'with')}.`)
  }
  if (e.drivingSide) {
    parts.push(`Traffic drives on the ${e.drivingSide} side of the road${e.callingCode ? `, and the international calling code is ${e.callingCode}` : ''}.`)
  }
  return parts.join(' ')
}
