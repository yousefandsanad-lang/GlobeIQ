import { feature } from 'topojson-client'
import { geoNaturalEarth1, geoPath } from 'd3-geo'
import worldData from 'world-atlas/countries-110m.json'
import { getContinentTheme } from '../utils/continentTheme'

const countries = feature(worldData, worldData.objects.countries)

// Countries too small to appear in 110m topology — show flag instead
const MICRO_COUNTRIES = new Set(['702', '336', '492', '674', '438', '020', '462', '470', '048', '442'])

export default function Silhouette({ continent, revealed, countryName, countryId, flagEmoji }) {
  const theme = getContinentTheme(continent)

  const isMicro = MICRO_COUNTRIES.has(String(countryId))

  const countryFeature = isMicro ? null : countries.features.find(
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

  return (
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
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto',
        overflow: 'hidden',
        WebkitTransform: 'translateZ(0)',
        willChange: 'transform',
      }}
    >
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
        {pathD ? (
          <path
            d={pathD}
            fill={revealed ? theme.primary : '#ffffff'}
            opacity={revealed ? 1 : 0.9}
            stroke={theme.background}
            strokeWidth={0.5}
            clipPath="url(#silhouette-clip)"
          />
        ) : (
          <text
            x="100"
            y="100"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={isMicro ? "60" : "64"}
          >
            {isMicro ? (flagEmoji ?? '?') : '?'}
          </text>
        )}
      </svg>

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
  )
}
