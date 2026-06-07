import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { slugify } from '../utils/slug'
import AdSlot from './AdSlot'
import { ADSTERRA } from '../utils/adSlots'

function flagEmojiToIso2(emoji) {
  try {
    return [...emoji]
      .map(c => String.fromCharCode(c.codePointAt(0) - 0x1F1E6 + 65))
      .join('')
      .toLowerCase()
  } catch {
    return null
  }
}

function FlagImage({ emoji, size = 20 }) {
  const iso2 = flagEmojiToIso2(emoji)
  if (!iso2) return <span style={{ fontSize: size, lineHeight: 1 }}>{emoji}</span>
  return (
    <img
      src={`https://flagcdn.com/w40/${iso2}.png`}
      width={size + 6}
      height={size}
      style={{ borderRadius: 2, objectFit: 'cover', display: 'block', flexShrink: 0 }}
      alt=""
      onError={e => { e.currentTarget.style.display = 'none' }}
    />
  )
}

const CONTINENT_ORDER = [
  'Africa',
  'Asia',
  'Europe',
  'North America',
  'South America',
  'Oceania',
  'Antarctica',
]

const MOBILE_STYLE = `
  @media (max-width: 399px) {
    .atlas-grid { grid-template-columns: 1fr !important; }
    .atlas-country-name { font-size: 11px !important; }
    .atlas-modal-card {
      width: 95% !important;
      max-height: 85vh !important;
      border-radius: 16px !important;
    }
  }
`

export default function AtlasModal({ collectedCountries, onClose, allCountries }) {
  const navigate = useNavigate()

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function openCountry(country) {
    onClose()
    navigate(`/countries/${slugify(country.name)}`)
  }

  const collectedSet = new Set(collectedCountries.map(String))

  const byContinent = {}
  CONTINENT_ORDER.forEach(c => { byContinent[c] = [] })
  allCountries.forEach(c => {
    const key = CONTINENT_ORDER.includes(c.continent) ? c.continent : 'Antarctica'
    byContinent[key].push(c)
  })
  CONTINENT_ORDER.forEach(c => {
    byContinent[c].sort((a, b) => a.name.localeCompare(b.name))
  })

  const total = allCountries.length
  const collected = collectedCountries.length

  return createPortal(
    <>
      <style>{MOBILE_STYLE}</style>
      <div
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Your atlas"
        style={{
          position: 'fixed',
          inset: 0,
          background: '#000000CC',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          className="atlas-modal-card"
          onClick={e => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#0F1420',
            border: '1px solid #ffffff15',
            borderRadius: 20,
            width: '90%',
            maxWidth: 480,
            maxHeight: '80vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 100000,
          }}
        >
          {/* Header */}
          <div style={{
            padding: 20,
            borderBottom: '1px solid #ffffff10',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: 18 }}>
                🗺️ Your Atlas
              </div>
              <div style={{ color: '#888', fontSize: 13, marginTop: 3 }}>
                {collected} / {total} countries discovered
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#888',
                fontSize: 20,
                cursor: 'pointer',
                lineHeight: 1,
                padding: 0,
                marginTop: 2,
              }}
            >
              ✕
            </button>
          </div>

          {/* Scrollable body */}
          <div style={{ overflowY: 'auto', flex: 1, padding: 16 }}>
            {CONTINENT_ORDER.map(continent => {
              const countries = byContinent[continent]
              if (!countries || countries.length === 0) return null

              const sampleColor = countries.find(c => c.continentColor)?.continentColor ?? '#888'

              return (
                <div key={continent}>
                  <div style={{
                    position: 'sticky',
                    top: 0,
                    background: '#0F1420',
                    zIndex: 10,
                    paddingTop: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 8,
                  }}>
                    <div style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: sampleColor,
                      flexShrink: 0,
                    }} />
                    <span style={{
                      color: sampleColor,
                      fontSize: 12,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                    }}>
                      {continent}
                    </span>
                  </div>

                  <div
                    className="atlas-grid"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 6,
                      marginBottom: 8,
                    }}
                  >
                    {countries.map(c => {
                      const isCollected = collectedSet.has(String(c.id))
                      const commonStyle = {
                        background: isCollected ? '#ffffff10' : '#ffffff05',
                        border: `1px solid ${isCollected ? '#ffffff20' : '#ffffff08'}`,
                        borderRadius: 8,
                        padding: '10px 12px',
                        minHeight: 44,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        boxSizing: 'border-box',
                        textAlign: 'left',
                        width: '100%',
                        font: 'inherit',
                        color: 'inherit',
                      }
                      const inner = (
                        <>
                          {isCollected
                            ? <FlagImage emoji={c.flagEmoji} size={16} />
                            : <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}>🔒</span>
                          }
                          <span
                            className="atlas-country-name"
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: isCollected ? '#fff' : '#555',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {isCollected ? c.name : '????????'}
                          </span>
                        </>
                      )

                      if (isCollected) {
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => openCountry(c)}
                            aria-label={`Open ${c.name} trophy page`}
                            style={{ ...commonStyle, cursor: 'pointer' }}
                          >
                            {inner}
                          </button>
                        )
                      }

                      return (
                        <div key={c.id} style={commonStyle}>
                          {inner}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            <div style={{ marginTop: 16 }}>
              <AdSlot unit={ADSTERRA.atlasModal} />
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
