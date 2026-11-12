import { clockShort } from './format.ts'

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
  intervals: 'Effort et repos qui alternent, pour le rameur et les complexes',
  emom: 'Un top à chaque période, pendant plusieurs rounds',
  countdown: 'Une seule durée qui descend, pour un AMRAP',
  stopwatch: 'Compte à l’endroit, avec des tours marqués à la main',
}

export function blankTimer(kind: TimerKind, id: string): Timer {
  const common = { id, name: '', prepare: 10 }
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

export function defaultName(timer: Timer): string {
  switch (timer.kind) {
    case 'intervals':
      return `${timer.rounds} × ${clockShort(timer.work)} / ${clockShort(timer.rest)}`
    case 'emom':
      return `EMOM ${timer.rounds}`
    case 'countdown':
      return `AMRAP ${Math.round(timer.duration / 60)}`
    case 'stopwatch':
      return 'Chrono libre'
  }
}

export function describe(timer: Timer): string {
  switch (timer.kind) {
    case 'intervals':
      return `${timer.rounds} séries · ${clockShort(timer.work)} d’effort · ${clockShort(timer.rest)} de repos`
    case 'emom':
      return `${timer.rounds} rounds · un top toutes les ${clockShort(timer.period)}`
    case 'countdown':
      return `${clockShort(timer.duration)} en comptant à rebours`
    case 'stopwatch':
      return 'Chrono montant, tours marqués à la main'
  }
}

export type SegmentKind = 'prepare' | 'work' | 'rest'

export type Segment = {
  kind: SegmentKind
  label: string
  duration: number
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
      break
  }

  return segments
}

export function totalRounds(segments: Segment[]): number {
  return segments.reduce((max, segment) => Math.max(max, segment.round), 0)
}
