import { feature } from 'topojson-client'
import { geoNaturalEarth1, geoPath } from 'd3-geo'
import worldData from 'world-atlas/countries-50m.json'
import countries from '../data/countries'
import { getContinentTheme } from '../utils/continentTheme'

const WIDTH = 1000
const HEIGHT = 500

const featureCollection = feature(worldData, worldData.objects.countries)
const projection = geoNaturalEarth1().fitSize([WIDTH, HEIGHT], featureCollection)
const pathGen = geoPath(projection)

const gameById = new Map()
countries.forEach(c => gameById.set(String(c.id), c))

function extractId(f) {
  if (f.id !== undefined && f.id !== null) return String(f.id)
  if (f.properties?.id !== undefined && f.properties.id !== null) {
    return String(f.properties.id)
  }
  return null
}

export default function WorldMap({ collectedCountries = [], currentCountryId }) {
  const collectedSet = new Set(collectedCountries.map(String))
  const currentIdStr = currentCountryId != null ? String(currentCountryId) : null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        WebkitTransform: 'translateZ(0)',
        willChange: 'transform',
      }}
    >
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="xMidYMid slice"
        width="100%"
        height="100%"
      >
        {featureCollection.features.map((f, idx) => {
          const id = extractId(f)
          const key = id ?? `noid-${idx}`
          const idCoerced = id != null ? String(id) : null
          const isCurrent =
            idCoerced != null &&
            currentIdStr != null &&
            idCoerced === String(currentIdStr)
          const isCollected =
            idCoerced != null &&
            collectedCountries.some(c => String(c) === idCoerced)

          let fill = '#ffffff06'
          let stroke = '#ffffff12'
          let strokeWidth = 0.3

          if (isCurrent) {
            fill = '#ffffff03'
          } else if (isCollected) {
            const game = gameById.get(idCoerced)
            if (game) {
              const theme = getContinentTheme(game.continent)
              fill = `${theme.primary}66`
              stroke = `${theme.primary}CC`
              strokeWidth = 0.6
            } else {
              fill = '#ffffff20'
              stroke = '#ffffff40'
              strokeWidth = 0.6
            }
          }

          return (
            <path
              key={key}
              d={pathGen(f)}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
          )
        })}
      </svg>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at center, transparent 40%, #0A0E1A 100%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
