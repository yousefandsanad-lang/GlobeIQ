import { feature } from 'topojson-client'
import { geoNaturalEarth1, geoPath } from 'd3-geo'
import worldData from 'world-atlas/countries-50m.json'
import { getContinentTheme } from '../utils/continentTheme'
import gameCountries from '../data/countries'

const topoCountries = feature(worldData, worldData.objects.countries)

const SPIN_CSS = `
@keyframes globeSpin {
  from { transform: rotateY(0deg); }
  to   { transform: rotateY(360deg); }
}
.micro-globe {
  display: inline-block;
  animation: globeSpin 3s linear infinite;
  font-size: 40px;
  line-height: 1;
}
`

function getMicroHint(country) {
  if (!country) return "One of the world's smallest nations"
  if (country.borders === 0) return 'An island nation surrounded by ocean'
  const pop = String(country.population ?? '')
  if (pop.includes('million')) {
    const num = parseFloat(pop)
    if (!isNaN(num) && num < 1) return "One of the world's smallest nations"
  }
  if (
    country.capital &&
    country.name &&
    country.capital.trim().toLowerCase() === country.name.trim().toLowerCase()
  ) return 'A city that is also a country'
  return "One of the world's smallest nations"
}

export default function Silhouette({ continent, revealed, countryName, countryId, flagEmoji }) {
  const theme = getContinentTheme(continent)

  const gameCountry = gameCountries.find(c => String(c.id) === String(countryId))

  const countryFeature = topoCountries.features.find(
    f => String(f.id) === String(countryId)
  )

  let pathD = null
  if (countryFeature) {
    try {
      const projection = geoNaturalEarth1().fitExtent([[30, 30], [170, 170]], countryFeature)
      const pathGen = geoPath().projection(projection)
      pathD = pathGen(countryFeature)
    } catch {
      pathD = null
    }
  }

  const isMissing = !pathD

  return (
    <>
      <style>{SPIN_CSS}</style>
      <div
        className="silhouette-pulse"
        style={{
          '--silhouette-glow': theme.glow,
          position: 'relative',
          width: 220,
          height: 220,
          background: theme.background,
          border: `2px solid ${theme.primary}`,
          borderRadius: 16,
          boxShadow: `0 0 30px ${theme.glow}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto',
          overflow: 'hidden',
          WebkitTransform: 'translateZ(0)',
          willChange: 'transform',
        }}
      >
        {isMissing ? (
          <>
            <span className="micro-globe">🌍</span>
            <div style={{
              color: theme.primary,
              fontSize: 12,
              fontStyle: 'italic',
              textAlign: 'center',
              padding: '0 16px',
              marginTop: 8,
            }}>
              {getMicroHint(gameCountry)}
            </div>
            <div style={{
              marginTop: 10,
              background: `${theme.primary}33`,
              border: `1px solid ${theme.primary}`,
              borderRadius: 20,
              padding: '3px 10px',
              fontSize: 10,
              color: theme.primary,
            }}>
              🔍 Micro Nation
            </div>
          </>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="200"
            height="200"
            viewBox="0 0 200 200"
            style={{ overflow: 'hidden' }}
          >
            <defs>
              <clipPath id="silhouette-clip">
                <rect x="0" y="0" width="200" height="200" />
              </clipPath>
            </defs>
            <path
              d={pathD}
              fill={revealed ? theme.primary : '#ffffff'}
              opacity={revealed ? 1 : 0.9}
              stroke={theme.background}
              strokeWidth={0.5}
              clipPath="url(#silhouette-clip)"
            />
          </svg>
        )}

        {revealed && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `${theme.primary}CC`,
              color: 'white',
              fontWeight: 'bold',
              fontSize: 20,
              textAlign: 'center',
              padding: 12,
              borderRadius: 16,
            }}
          >
            {countryName}
          </div>
        )}
      </div>
    </>
  )
}
