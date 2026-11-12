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

function clockShort(seconds: number): string {
  if (seconds % 60 === 0 && seconds >= 60) {
    const m = seconds / 60
    return `${m} min`
  }
  if (seconds < 60) return `${seconds} s`
  return `${Math.floor(seconds / 60)} min ${seconds % 60} s`
}
