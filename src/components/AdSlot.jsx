import { useEffect, useRef } from 'react'

// Renders a single Adsterra ad unit. `unit` comes from ADSTERRA in
// utils/adSlots.js. If the unit isn't configured yet (no key/src), renders
// nothing — so the layout never breaks before activation.
//
// Adsterra's banner format reads a GLOBAL `atOptions`, so two banner units
// must not initialise simultaneously. GlobeIQ only ever shows one slot at a
// time (between-rounds vs atlas modal vs country route), so a simple per-slot
// DOM injection is safe. The unit is injected once on mount and torn down with
// the container when React unmounts it.
export default function AdSlot({ unit, style }) {
  const ref = useRef(null)
  const injected = useRef(false)

  useEffect(() => {
    if (injected.current) return
    if (!unit || !unit.key || !unit.src || !ref.current) return
    injected.current = true
    const host = ref.current

    if (unit.type === 'native') {
      const script = document.createElement('script')
      script.async = true
      script.setAttribute('data-cfasync', 'false')
      script.src = unit.src
      const container = document.createElement('div')
      container.id = `container-${unit.key}`
      host.appendChild(script)
      host.appendChild(container)
    } else {
      // iframe banner: define atOptions, then load invoke.js which reads it.
      const cfg = document.createElement('script')
      cfg.type = 'text/javascript'
      cfg.text =
        'atOptions = ' +
        JSON.stringify({
          key: unit.key,
          format: 'iframe',
          height: unit.height || 250,
          width: unit.width || 300,
          params: {},
        }) +
        ';'
      const invoke = document.createElement('script')
      invoke.type = 'text/javascript'
      invoke.src = unit.src
      host.appendChild(cfg)
      host.appendChild(invoke)
    }
  }, [unit])

  if (!unit || !unit.key || !unit.src) return null

  return (
    <div
      ref={ref}
      className="ad-slot"
      aria-hidden="true"
      style={{ display: 'flex', justifyContent: 'center', minHeight: unit.height || undefined, ...style }}
    />
  )
}
