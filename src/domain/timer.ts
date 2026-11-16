import { clockShort } from './format.ts'
import { newId } from './id.ts'

export type TimerKind = 'intervals' | 'emom' | 'countdown' | 'stopwatch'

type Common = {
  id: string
  name: string
  prepare: number
}

export type Timer = Common &
  (
    | { kind: 'intervals'; work: number; rest: number; rounds: number }
    | { kind: 'emom'; period: number; rounds: number }
    | { kind: 'countdown'; duration: number }
    | { kind: 'stopwatch' }
  )

export const KIND_LABELS: Record<TimerKind, string> = {
  intervals: 'Intervalles',
  emom: 'EMOM',
  countdown: 'Compte à rebours',
  stopwatch: 'Chrono',
}

export const KIND_HINTS: Record<TimerKind, string> = {
  intervals: 'Effort et repos qui alternent',
  emom: 'Un top à chaque période',
  countdown: 'Une durée qui descend',
  stopwatch: 'Compte à l’endroit, tours à la main',
}

// a card holds the name on one line beside its total, the field stops the athlete there
export const NAME_MAX = 24

export function blankTimer(kind: TimerKind, id: string): Timer {
  const common = { id, name: '', prepare: 15 }
  switch (kind) {
    case 'intervals':
      return { ...common, kind, work: 60, rest: 30, rounds: 8 }
    case 'emom':
      return { ...common, kind, period: 60, rounds: 12 }
    case 'countdown':
      return { ...common, kind, duration: 1200 }
    case 'stopwatch':
      return { ...common, kind }
  }
}

export function describe(timer: Timer): string {
  switch (timer.kind) {
    case 'intervals':
      return `${timer.rounds} séries · ${clockShort(timer.work)} / ${clockShort(timer.rest)}`
    case 'emom':
      return `${timer.rounds} rounds · période de ${clockShort(timer.period)}`
    case 'countdown':
      return `${clockShort(timer.duration)} en comptant à rebours`
    case 'stopwatch':
      return 'Chrono montant, tours à la main'
  }
}

export type Total = { value: string; unit: string }

// the figure the athlete picks a timer on, rounded to the minute: an open-ended timer has none
export function totalShort(timer: Timer): Total | null {
  const segments = buildSegments(timer)
  if (segments.some((segment) => segment.duration === null)) return null
  const seconds = segments.reduce((total, segment) => total + (segment.duration ?? 0), 0)
  if (seconds < 60) return { value: String(seconds), unit: 's' }
  return { value: String(Math.round(seconds / 60)), unit: 'min' }
}

export function copyOf(timer: Timer): Timer {
  return { ...timer, id: newId(), name: `${timer.name} (copie)` }
}

export type SegmentKind = 'prepare' | 'work' | 'rest'

// a null duration runs until the athlete stops it, and only the last segment may be open
export type Segment = {
  kind: SegmentKind
  label: string
  duration: number | null
  round: number
}

export function buildSegments(timer: Timer): Segment[] {
  const segments: Segment[] = []
  if (timer.prepare > 0) {
    segments.push({ kind: 'prepare', label: 'Préparation', duration: timer.prepare, round: 0 })
  }

  switch (timer.kind) {
    case 'intervals':
      for (let round = 1; round <= timer.rounds; round += 1) {
        segments.push({ kind: 'work', label: 'Effort', duration: timer.work, round })
        // the rest after the last round is dead time, the session is over
        if (timer.rest > 0 && round < timer.rounds) {
          segments.push({ kind: 'rest', label: 'Repos', duration: timer.rest, round })
        }
      }
      break
    case 'emom':
      for (let round = 1; round <= timer.rounds; round += 1) {
        segments.push({ kind: 'work', label: `Round ${round}`, duration: timer.period, round })
      }
      break
    case 'countdown':
      segments.push({ kind: 'work', label: 'En route', duration: timer.duration, round: 1 })
      break
    case 'stopwatch':
      segments.push({ kind: 'work', label: 'Chrono', duration: null, round: 0 })
      break
  }

  return segments
}

export function totalRounds(segments: Segment[]): number {
  return segments.reduce((max, segment) => Math.max(max, segment.round), 0)
}
