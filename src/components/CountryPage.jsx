import { useEffect, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Silhouette from './Silhouette'
import { getContinentTheme } from '../utils/continentTheme'
import { findCountryBySlug, slugify } from '../utils/slug'

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

  useEffect(() => {
    if (!country) {
      document.title = 'Not found — GlobeIQ'
      return
    }
    document.title = collected
      ? `${country.name} — GlobeIQ`
      : `🔒 Locked — GlobeIQ`
  }, [country, collected])

  if (!country) {
    return (
      <main className="country-page country-not-found">
        <button className="country-back" onClick={() => navigate('/')}>← Back to game</button>
        <h1 className="country-name">Country not found</h1>
        <p className="country-locked-message">
          We don't have a country at this URL. Try opening it from your atlas.
        </p>
        <Link to="/" className="country-cta">Play today's puzzle →</Link>
      </main>
    )
  }

  if (!collected) {
    return (
      <main className="country-page country-locked">
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
      </main>
    )
  }

  const theme = getContinentTheme(country.continent)

  return (
    <main className="country-page" style={{ '--country-accent': theme.primary }}>
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

      <nav className="country-nav" aria-label="Adjacent countries">
        {prev ? (
          <Link to={`/countries/${slugify(prev.name)}`} className="country-nav-link country-nav-prev">
            <span className="country-nav-arrow">◀</span>
            <span className="country-nav-label">
              {collectedSet.has(String(prev.id)) ? prev.name : '🔒'}
            </span>
          </Link>
        ) : <span />}
        {next ? (
          <Link to={`/countries/${slugify(next.name)}`} className="country-nav-link country-nav-next">
            <span className="country-nav-label">
              {collectedSet.has(String(next.id)) ? next.name : '🔒'}
            </span>
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
