import { feature } from 'topojson-client'

// The world-atlas 50m TopoJSON is ~756 KB raw / ~236 KB gzipped — roughly half
// the old JS bundle when imported statically. We instead serve it as a static
// asset (public/data/countries-50m.json) and fetch it once at runtime, sharing
// the parsed FeatureCollection between the WorldMap background and the
// Silhouette hero. index.html preloads the file so the download starts during
// HTML parse, in parallel with the (now much smaller) JS bundle.

const TOPOLOGY_URL = '/data/countries-50m.json'

let cache = null
let inflight = null

export function loadWorldTopology() {
  if (cache) return Promise.resolve(cache)
  if (!inflight) {
    inflight = fetch(TOPOLOGY_URL)
      .then(res => {
        if (!res.ok) throw new Error(`topology fetch failed: ${res.status}`)
        return res.json()
      })
      .then(world => {
        cache = feature(world, world.objects.countries)
        return cache
      })
      .catch(err => {
        // Allow a later retry if the first attempt failed (offline, etc.)
        inflight = null
        throw err
      })
  }
  return inflight
}

// Synchronous accessor for components that can render instantly once the
// topology is already in memory (avoids a loading flash on later renders).
export function getCachedTopology() {
  return cache
}
