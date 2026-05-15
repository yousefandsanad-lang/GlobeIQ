import { useEffect, useRef } from 'react'
import { ADSENSE_CLIENT } from '../utils/adSlots'

export default function AdSlot({ slotId, format = 'auto', layout, style }) {
  const pushedRef = useRef(false)

  useEffect(() => {
    if (!slotId || pushedRef.current) return
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({})
      pushedRef.current = true
    } catch {}
  }, [slotId])

  if (!slotId) return null

  return (
    <ins
      className="adsbygoogle"
      style={{ display: 'block', ...style }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={slotId}
      data-ad-format={format}
      data-full-width-responsive="true"
      {...(layout ? { 'data-ad-layout': layout } : {})}
    />
  )
}
