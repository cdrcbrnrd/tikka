export const pad = (n: number) => String(n).padStart(2, '0')

export function clock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}

export function clockTenths(ms: number): string {
  const total = Math.max(0, ms)
  const tenths = Math.floor((total % 1000) / 100)
  return `${clock(total / 1000)}.${tenths}`
}

export function sessionDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

// a unit symbol never leaves the number it measures, so the line may not break between them
export const NBSP = '\u00a0'

export function clockShort(seconds: number): string {
  if (seconds < 60) return `${seconds}${NBSP}s`
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return rest === 0 ? `${minutes}${NBSP}min` : `${minutes}${NBSP}min ${rest}${NBSP}s`
}

export function plural(count: number, word: string): string {
  return `${count} ${word}${count > 1 ? 's' : ''}`
}

export function splits(laps: number[]): number[] {
  return laps.map((lap, index) => lap - (laps[index - 1] ?? 0))
}
