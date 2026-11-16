import { clockShort } from './format.ts'
import { newId } from './id.ts'
import { buildSegments, TABATA_REST, TABATA_WORK } from './plan.ts'

export type TimerKind =
  | 'stopwatch'
  | 'countdown'
  | 'rest'
  | 'intervals'
  | 'tabata'
  | 'emom'
  | 'exmom'
  | 'fortime'

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
    | ({ kind: 'tabata'; rounds: number } & Blocked)
    | ({ kind: 'emom'; period: number; rounds: number } & Blocked)
    | ({ kind: 'exmom'; period: number; rounds: number } & Blocked)
    | { kind: 'countdown'; duration: number }
    | { kind: 'rest'; duration: number }
    | { kind: 'fortime'; cap: number | null }
    | { kind: 'stopwatch' }
  )

export const KIND_LABELS: Record<TimerKind, string> = {
  stopwatch: 'Chrono',
  countdown: 'Compte à rebours',
  rest: 'Repos entre séries',
  intervals: 'Intervalles',
  tabata: 'Tabata',
  emom: 'EMOM',
  exmom: 'E2MOM',
  fortime: 'For Time',
}

export const KIND_HINTS: Record<TimerKind, string> = {
  stopwatch: 'Compte à l’endroit, tours à la main',
  countdown: 'Une durée qui descend',
  rest: 'Une récupération lancée à la main',
  intervals: 'Effort et repos qui alternent',
  tabata: `Le format fixe, ${clockShort(TABATA_WORK)} d’effort et ${clockShort(TABATA_REST)} de repos`,
  emom: 'Un top à chaque période',
  exmom: 'Un top toutes les X minutes',
  fortime: 'Jusqu’à ce que le travail soit fini',
}

export const KIND_GROUPS: { label: string; kinds: TimerKind[] }[] = [
  { label: 'Chrono', kinds: ['stopwatch', 'countdown', 'rest'] },
  { label: 'Intervalles', kinds: ['intervals', 'tabata'] },
  { label: 'À la minute', kinds: ['emom', 'exmom'] },
  { label: 'CrossFit', kinds: ['fortime'] },
]

// a card holds the name on one line beside its total, the field stops the athlete there
export const NAME_MAX = 24

// a rest between series starts the moment it is launched, counting it down would be a second wait
export function takesPrepare(kind: TimerKind): boolean {
  return kind !== 'rest'
}

// the numeric fields an editor can set, typed so a key can never drift from the model
export const SETTINGS = ['prepare', 'work', 'rest', 'rounds', 'period', 'duration'] as const
export type Setting = (typeof SETTINGS)[number]

export function blankTimer(kind: TimerKind, id: string): Timer {
  const common = { id, name: '', prepare: 15, warmup: 0, cooldown: 0 }
  const blocked = { blocks: 1, blockRest: 60, keepLastRest: false }
  switch (kind) {
    case 'intervals':
      return { ...common, ...blocked, kind, work: 60, rest: 30, rounds: 8 }
    case 'tabata':
      return { ...common, ...blocked, kind, rounds: 8 }
    case 'emom':
      return { ...common, ...blocked, kind, period: 60, rounds: 12 }
    case 'exmom':
      return { ...common, ...blocked, kind, period: 120, rounds: 10 }
    case 'countdown':
      return { ...common, kind, duration: 1200 }
    case 'rest':
      return { ...common, kind, prepare: 0, duration: 90 }
    case 'fortime':
      return { ...common, kind, cap: null }
    case 'stopwatch':
      return { ...common, kind }
  }
}

export function describe(timer: Timer): string {
  switch (timer.kind) {
    case 'intervals':
      return `${timer.rounds} séries · ${clockShort(timer.work)} / ${clockShort(timer.rest)}`
    case 'tabata':
      return `${timer.rounds} cycles · ${clockShort(TABATA_WORK)} / ${clockShort(TABATA_REST)}`
    case 'emom':
    case 'exmom':
      return `${timer.rounds} rounds · période de ${clockShort(timer.period)}`
    case 'countdown':
      return `${clockShort(timer.duration)} en comptant à rebours`
    case 'rest':
      return `${clockShort(timer.duration)} de récupération`
    case 'fortime':
      return timer.cap === null ? 'Chrono montant, sans limite' : `Chrono montant, ${clockShort(timer.cap)} au plus`
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
