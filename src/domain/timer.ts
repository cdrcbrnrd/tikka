import { clockShort, NBSP, plural } from './format.ts'
import { newId } from './id.ts'
import { buildSegments, planOf, STEP_WORD, TABATA_REST, TABATA_WORK, type Segment } from './plan.ts'

export const KINDS = [
  'stopwatch',
  'countdown',
  'rest',
  'intervals',
  'tabata',
  'circuit',
  'ladder',
  'emom',
  'exmom',
  'amrap',
  'fortime',
] as const

export type TimerKind = (typeof KINDS)[number]

type Common = {
  id: string
  name: string
  prepare: number
  warmup: number
  cooldown: number
}

export type Blocked = { blocks: number; blockRest: number; keepLastRest: boolean }

// an id of its own, so a row keeps its identity while the list is edited around it
export type TimerStep = { id: string; label: string; duration: number }

export const STEPS_MAX = 20
export const STEP_DURATION = 40

// the bounds every duration field shares, wherever it is rendered
export const MIN_DURATION = 5
export const MAX_DURATION = 3600

type Listed = { steps: TimerStep[]; rest: number; rounds: number }

export type Timer = Common &
  (
    | ({ kind: 'intervals'; work: number; rest: number; rounds: number } & Blocked)
    | ({ kind: 'tabata'; rounds: number } & Blocked)
    | ({ kind: 'circuit' } & Listed & Blocked)
    | ({ kind: 'ladder' } & Listed & Blocked)
    | ({ kind: 'emom'; period: number; rounds: number } & Blocked)
    | ({ kind: 'exmom'; period: number; rounds: number } & Blocked)
    | { kind: 'countdown'; duration: number }
    | { kind: 'rest'; duration: number }
    | { kind: 'amrap'; duration: number }
    | { kind: 'fortime'; cap: number }
    | { kind: 'stopwatch' }
  )

export const KIND_LABELS: Record<TimerKind, string> = {
  stopwatch: 'Chrono',
  countdown: 'Compte à rebours',
  rest: 'Repos entre séries',
  intervals: 'Intervalles',
  tabata: 'Tabata',
  circuit: 'Circuit',
  ladder: 'Pyramide',
  emom: 'EMOM',
  exmom: 'E2MOM',
  amrap: 'AMRAP',
  fortime: 'For Time',
}

export const KIND_HINTS: Record<TimerKind, string> = {
  stopwatch: 'Compte à l’endroit, tours à la main',
  countdown: 'Une durée qui descend',
  rest: 'Une récupération lancée à la main',
  intervals: 'Effort et repos qui alternent',
  tabata: `Le format fixe, ${clockShort(TABATA_WORK)} d’effort et ${clockShort(TABATA_REST)} de repos`,
  circuit: 'Des exercices qui s’enchaînent',
  ladder: 'Des paliers qui montent, puis redescendent',
  emom: 'Un top à chaque période',
  exmom: 'Un top toutes les X minutes',
  amrap: 'Le plus de tours possible dans le temps',
  fortime: 'Jusqu’à ce que le travail soit fini',
}

export function isKind(value: string | undefined): value is TimerKind {
  return KINDS.some((kind) => kind === value)
}

// the word a kind counts in, so the screen that runs it speaks like the screen that set it
export const KIND_ROUND: Record<TimerKind, string> = {
  stopwatch: 'Tour',
  countdown: 'Round',
  rest: 'Round',
  intervals: 'Série',
  tabata: 'Cycle',
  circuit: 'Tour',
  ladder: 'Tour',
  emom: 'Round',
  exmom: 'Round',
  amrap: 'Tour',
  fortime: 'Round',
}

export const KIND_GROUPS: { label: string; kinds: TimerKind[] }[] = [
  { label: 'Chrono', kinds: ['stopwatch', 'countdown', 'rest'] },
  { label: 'Intervalles', kinds: ['intervals', 'tabata', 'circuit', 'ladder'] },
  { label: 'À la minute', kinds: ['emom', 'exmom'] },
  { label: 'CrossFit', kinds: ['amrap', 'fortime'] },
]

// a card holds the name on one line beside its total, the field stops the athlete there
export const NAME_MAX = 24

const DEFAULT_PREPARE = 15

// a rest between series starts the moment it is launched, counting it down would be a second wait
export function takesPrepare(kind: TimerKind): boolean {
  return kind !== 'rest'
}

// the numeric fields an editor can set, typed so a key can never drift from the model
export const SETTINGS = [
  'prepare',
  'warmup',
  'cooldown',
  'work',
  'rest',
  'rounds',
  'period',
  'duration',
  'blocks',
  'blockRest',
  'cap',
] as const
export type Setting = (typeof SETTINGS)[number]

export function blankTimer(kind: TimerKind, id: string): Timer {
  const common = { id, name: '', prepare: DEFAULT_PREPARE, warmup: 0, cooldown: 0 }
  const blocked = { blocks: 1, blockRest: 60, keepLastRest: false }
  switch (kind) {
    case 'intervals':
      return { ...common, ...blocked, kind, work: 60, rest: 30, rounds: 8 }
    case 'tabata':
      return { ...common, ...blocked, kind, rounds: 8 }
    case 'circuit':
      return { ...common, ...blocked, kind, steps: [step('')], rest: 20, rounds: 3 }
    case 'ladder':
      return {
        ...common,
        ...blocked,
        kind,
        steps: [step('', 20), step('', 40), step('', 60)],
        rest: 20,
        rounds: 1,
      }
    case 'emom':
      return { ...common, ...blocked, kind, period: 60, rounds: 12 }
    case 'exmom':
      return { ...common, ...blocked, kind, period: 120, rounds: 10 }
    case 'amrap':
      return { ...common, kind, duration: 600 }
    case 'countdown':
      return { ...common, kind, duration: 1200 }
    case 'rest':
      return { ...common, kind, prepare: 0, duration: 90 }
    case 'fortime':
      return { ...common, kind, cap: 0 }
    case 'stopwatch':
      return { ...common, kind }
  }
}

function step(label: string, duration = STEP_DURATION): TimerStep {
  return { id: newId(), label, duration }
}

export function describe(timer: Timer): string {
  const stack = 'blocks' in timer && timer.blocks > 1 ? `${timer.blocks} blocs de ` : ''
  switch (timer.kind) {
    case 'intervals':
      return `${stack}${timer.rounds} séries · ${clockShort(timer.work)} / ${clockShort(timer.rest)}`
    case 'tabata':
      return `${stack}${timer.rounds} cycles · ${clockShort(TABATA_WORK)} / ${clockShort(TABATA_REST)}`
    case 'circuit':
    case 'ladder': {
      const word = STEP_WORD[timer.kind].one.toLowerCase()
      // the stack repeats the rounds, not the list, so it cannot lead the sentence here
      return `${plural(timer.steps.length, word)} · ${stack}${plural(timer.rounds, 'tour')}`
    }
    case 'emom':
    case 'exmom':
      return `${stack}${timer.rounds} rounds · période de ${clockShort(timer.period)}`
    case 'amrap':
      return `${clockShort(timer.duration)}, le plus de tours possible`
    case 'countdown':
      return `${clockShort(timer.duration)} en comptant à rebours`
    case 'rest':
      return `${clockShort(timer.duration)} de récupération`
    case 'fortime':
      return timer.cap > 0
        ? `Chrono montant, ${clockShort(timer.cap)} au plus`
        : 'Chrono montant, sans limite'
    case 'stopwatch':
      return 'Chrono montant, tours à la main'
  }
}

function openEnded(segments: Segment[]): boolean {
  return segments.some((segment) => segment.duration === null)
}

// the option only shows where it changes something: a rest to keep, and nothing already following
export function canKeepLastRest(timer: Timer): boolean {
  if (timer.cooldown > 0) return false
  return planOf(timer).blocks.some((block) => block.steps.some((step) => step.rest > 0))
}

// a timer that runs until the athlete stops it: it has no total, and nothing can follow it
export function isOpenEnded(timer: Timer): boolean {
  return openEnded(buildSegments(timer))
}

// the figure the athlete picks a timer on, rounded to the minute: an open-ended timer has none
export function totalShort(timer: Timer): string | null {
  const segments = buildSegments(timer)
  if (openEnded(segments)) return null
  const seconds = segments.reduce((total, segment) => total + (segment.duration ?? 0), 0)
  if (seconds < 60) return `${seconds}${NBSP}s`
  return `${Math.round(seconds / 60)}${NBSP}min`
}

// the name a new chrono opens with: its kind, numbered if the athlete already has one
export function freeName(kind: TimerKind, timers: Timer[]): string {
  const base = KIND_LABELS[kind]
  const taken = (name: string) => timers.some((timer) => timer.name === name)
  if (!taken(base)) return base
  for (let suffix = 2; suffix < 100; suffix += 1) {
    if (!taken(`${base} ${suffix}`)) return `${base} ${suffix}`
  }
  return base
}

export function copyOf(timer: Timer): Timer {
  const copy = { ...timer, id: newId(), name: `${timer.name} (copie)` }
  // a flat spread would hand the copy the same rows, and two chronos would share their ids
  return 'steps' in copy ? { ...copy, steps: copy.steps.map((item) => ({ ...item, id: newId() })) } : copy
}
