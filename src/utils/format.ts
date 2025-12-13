export function formatMinutesToHM(totalMinutes: number) {
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h <= 0) return `${m}m`
  return `${h}h ${m}m`
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat('en-US').format(n)
}

export function formatDistance(km: number, units: 'metric' | 'imperial') {
  if (units === 'imperial') {
    const miles = km * 0.621371
    return `${miles.toFixed(1)} mi`
  }
  return `${km.toFixed(1)} km`
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}
