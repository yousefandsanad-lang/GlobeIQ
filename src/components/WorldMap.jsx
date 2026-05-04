import { useState } from 'react'
import { feature } from 'topojson-client'
import { geoNaturalEarth1, geoPath } from 'd3-geo'
import worldData from 'world-atlas/countries-50m.json'
import countries from '../data/countries'
import { getContinentTheme } from '../utils/continentTheme'

const featureCollection = feature(worldData, worldData.objects.countries)
const projection = geoNaturalEarth1().scale(153).translate([500, 250])
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

export default function WorldMap({ collectedCountries = [], currentCountryId, allCountries = [] }) {
  const collectedSet = new Set(collectedCountries.map(String))
  const currentIdStr = currentCountryId != null ? String(currentCountryId) : null
  const nameById = new Map()
  if (allCountries && allCountries.length > 0) {
    allCountries.forEach(c => {
      nameById.set(String(c.id), c.name)
      nameById.set(c.id, c.name)
      nameById.set(String(parseInt(c.id)), c.name)
    })
  }
  const [hoveredCountry, setHoveredCountry] = useState(null)

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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        viewBox="0 0 1000 500"
        preserveAspectRatio="xMidYMid meet"
        style={{
          width: '100%',
          height: '100%',
          minWidth: '100vw',
          minHeight: '100vh',
          pointerEvents: 'none',
        }}
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
              style={isCollected ? { pointerEvents: 'auto', cursor: 'pointer' } : undefined}
              onMouseEnter={isCollected ? (e) => {
                const name = nameById.get(idCoerced)
                if (name) setHoveredCountry({ name, x: e.clientX, y: e.clientY })
              } : undefined}
              onMouseMove={isCollected ? (e) => {
                setHoveredCountry(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)
              } : undefined}
              onMouseLeave={isCollected ? () => setHoveredCountry(null) : undefined}
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

      {hoveredCountry && (
        <div
          style={{
            position: 'fixed',
            left: hoveredCountry.x + 12,
            top: hoveredCountry.y - 28,
            background: '#000000CC',
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: 20,
            border: '1px solid #ffffff30',
            pointerEvents: 'none',
            zIndex: 999,
            whiteSpace: 'nowrap',
          }}
        >
          {hoveredCountry.name}
        </div>
      )}
    </div>
  )
}
