import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import Silhouette from './Silhouette'
import { getContinentTheme } from '../utils/continentTheme'
import { findCountryBySlug, slugify } from '../utils/slug'

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
  const canonical = `${SITE_URL}/countries/${slugify(country.name)}`

  const prevSlug = prev ? slugify(prev.name) : null
  const nextSlug = next ? slugify(next.name) : null
  const prevCollected = prev ? collectedSet.has(String(prev.id)) : false
  const nextCollected = next ? collectedSet.has(String(next.id)) : false

  const nav = (
    <nav className="country-nav" aria-label="Adjacent countries">
      {prev ? (
        <Link
          to={`/countries/${prevSlug}`}
          className="country-nav-link country-nav-prev"
          aria-label={prevCollected ? `Previous: ${prev.name}` : 'Previous country (locked)'}
        >
          <span className="country-nav-arrow">◀</span>
          <span className="country-nav-label">
            {prevCollected ? prev.name : '🔒'}
          </span>
        </Link>
      ) : <span />}
      {next ? (
        <Link
          to={`/countries/${nextSlug}`}
          className="country-nav-link country-nav-next"
          aria-label={nextCollected ? `Next: ${next.name}` : 'Next country (locked)'}
        >
          <span className="country-nav-label">
            {nextCollected ? next.name : '🔒'}
          </span>
          <span className="country-nav-arrow">▶</span>
        </Link>
      ) : <span />}
    </nav>
  )

  if (!collected) {
    return (
      <main className="country-page country-locked">
        <Helmet>
          <title>🔒 Locked — GlobeIQ</title>
          <meta name="description" content="Solve today's GlobeIQ puzzle to unlock more countries in your atlas." />
          <meta name="robots" content="noindex" />
        </Helmet>
        <button className="country-back" onClick={() => navigate(-1)}>← Back</button>
        <div className="country-flag-row">
          <div className="country-flag-locked">🔒</div>
          <h1 className="country-name">????????</h1>
          <div className="country-meta">Locked</div>
        </div>
        <p className="country-locked-message">
          Solve today's puzzle to unlock more countries. Come back daily to grow your atlas.
        </p>
        <Link to="/" className="country-cta">Play today's puzzle →</Link>
        {nav}
      </main>
    )
  }

  const title = `${country.name} — Flag, Capital, Region & Facts | GlobeIQ`
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

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'GlobeIQ', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: country.continent },
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
        <meta property="og:image" content={`${SITE_URL}/preview.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${country.name} — GlobeIQ`} />
        <meta name="twitter:description" content={ogDescription} />
        <meta name="twitter:image" content={`${SITE_URL}/preview.png`} />
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

      {nav}
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
