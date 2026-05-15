export function trackEvent(name, params = {}) {
  if (typeof window === 'undefined') return
  if (typeof window.gtag !== 'function') return
  window.gtag('event', name, params)
}

const ATLAS_MILESTONES = [10, 25, 50, 100, 150]
export function atlasMilestoneFor(count) {
  return ATLAS_MILESTONES.includes(count) ? count : null
}

const STREAK_MILESTONES = [3, 7, 14, 30, 100]
export function streakMilestoneFor(streak) {
  return STREAK_MILESTONES.includes(streak) ? streak : null
}
