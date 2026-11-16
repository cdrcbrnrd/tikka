import { clockShort } from './format.ts'
import { newId } from './id.ts'
import { buildSegments } from './plan.ts'

export type TimerKind = 'intervals' | 'emom' | 'countdown' | 'stopwatch'

type Common = {
  id: string
  name: string
  prepare: number
  warmup: number
  cooldown: number
}

export type Blocked = { blocks: number; blockRest: number; keepLastRest: boolean }

export type Timer = Common &
  (
    | ({ kind: 'intervals'; work: number; rest: number; rounds: number } & Blocked)
    | ({ kind: 'emom'; period: number; rounds: number } & Blocked)
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
  const common = { id, name: '', prepare: 15, warmup: 0, cooldown: 0 }
  const blocked = { blocks: 1, blockRest: 60, keepLastRest: false }
  switch (kind) {
    case 'intervals':
      return { ...common, ...blocked, kind, work: 60, rest: 30, rounds: 8 }
    case 'emom':
      return { ...common, ...blocked, kind, period: 60, rounds: 12 }
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
