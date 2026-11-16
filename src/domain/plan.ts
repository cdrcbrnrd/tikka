import type { Blocked, Timer } from './timer.ts'

export type SegmentKind = 'prepare' | 'work' | 'rest'

// a null duration runs until the athlete stops it, and only the last segment may be open
export type Segment = {
  kind: SegmentKind
  label: string
  detail?: string
  duration: number | null
  round: number
}

export type PlanStep = { label: string; work: number | null; rest: number }

export type PlanBlock = {
  label: string | null
  steps: readonly PlanStep[]
  repeat: number
  rest: number
  counts: boolean
  numbered: boolean
}

export type Plan = {
  prepare: number
  warmup: number
  cooldown: number
  blocks: PlanBlock[]
  keepLastRest: boolean
}

function stacked(series: Blocked, steps: PlanStep[], repeat: number, numbered = false): PlanBlock[] {
  const count = Math.max(1, series.blocks)
  return Array.from({ length: count }, (_, index) => ({
    label: count > 1 ? `Série ${index + 1} / ${count}` : null,
    steps,
    repeat,
    rest: series.blockRest,
    counts: true,
    numbered,
  }))
}

function once(label: string, work: number | null): PlanBlock {
  return {
    label: null,
    steps: [{ label, work, rest: 0 }],
    repeat: 1,
    rest: 0,
    counts: work !== null,
    numbered: false,
  }
}

export function planOf(timer: Timer): Plan {
  const common = {
    prepare: timer.prepare,
    warmup: timer.warmup,
    cooldown: timer.cooldown,
    keepLastRest: 'keepLastRest' in timer ? timer.keepLastRest : false,
  }

  switch (timer.kind) {
    case 'intervals':
      return {
        ...common,
        blocks: stacked(timer, [{ label: 'Effort', work: timer.work, rest: timer.rest }], timer.rounds),
      }
    case 'emom':
      return {
        ...common,
        blocks: stacked(timer, [{ label: 'Round', work: timer.period, rest: 0 }], timer.rounds, true),
      }
    case 'countdown':
      return { ...common, blocks: [once('En route', timer.duration)] }
    case 'stopwatch':
      return { ...common, blocks: [once('Chrono', null)] }
  }
}

export function expand(plan: Plan): Segment[] {
  const segments: Segment[] = []
  let round = 0
  let open = false

  if (plan.prepare > 0) {
    segments.push({ kind: 'prepare', label: 'Préparation', duration: plan.prepare, round: 0 })
  }
  if (plan.warmup > 0) {
    segments.push({ kind: 'work', label: 'Échauffement', duration: plan.warmup, round: 0 })
  }

  for (const [index, block] of plan.blocks.entries()) {
    if (open) break
    const detail = block.label ?? undefined

    for (let pass = 1; pass <= block.repeat && !open; pass += 1) {
      if (block.counts) round += 1

      for (const [position, step] of block.steps.entries()) {
        // the number the athlete reads has to be the one the screen counts, series after series
        const label = block.numbered ? `${step.label} ${round}` : step.label
        segments.push({ kind: 'work', label, detail, duration: step.work, round })

        // nothing may follow an open segment, which is what keeps it the last one
        if (step.work === null) {
          open = true
          break
        }

        const tail = pass === block.repeat && position === block.steps.length - 1
        if (step.rest > 0 && (!tail || plan.keepLastRest)) {
          segments.push({ kind: 'rest', label: 'Repos', detail, duration: step.rest, round })
        }
      }
    }

    // a series rest only bridges two series, so the last one is dead time whatever the option says
    if (!open && index < plan.blocks.length - 1 && block.rest > 0) {
      segments.push({ kind: 'rest', label: 'Repos de série', detail, duration: block.rest, round })
    }
  }

  // the cool-down keeps the round it follows, so the counter never walks backwards on screen
  if (!open && plan.cooldown > 0) {
    segments.push({ kind: 'rest', label: 'Retour au calme', duration: plan.cooldown, round })
  }

  return segments
}

export function buildSegments(timer: Timer): Segment[] {
  return expand(planOf(timer))
}

export function totalRounds(segments: Segment[]): number {
  return segments.reduce((max, segment) => Math.max(max, segment.round), 0)
}
