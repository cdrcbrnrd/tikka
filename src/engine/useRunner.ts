import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { buildSegments, clockedIndex, totalRounds, type Segment } from '../domain/plan.ts'
import type { Timer } from '../domain/timer.ts'
import { createCueScheduler } from './cueScheduler.ts'
import { unlockAudio, playCue } from './cues.ts'

export type RunnerStatus = 'idle' | 'running' | 'paused' | 'done'

export type Runner = {
  status: RunnerStatus
  elapsedMs: number
  sessionMs: number
  totalMs: number
  segment: Segment | null
  nextSegment: Segment | null
  segmentRemainingMs: number
  segmentProgress: number
  round: number
  rounds: number
  laps: number[]
  openEnded: boolean
  completed: boolean
  start: () => void
  pause: () => void
  resume: () => void
  stop: () => void
  lap: () => void
}

// the display only needs tenths, a state change per frame would re-render for nothing
const TICK_MS = 100

export function useRunner(timer: Timer): Runner {
  const segments = useMemo(() => buildSegments(timer), [timer])
  const bounds = useMemo(() => cumulativeBounds(segments), [segments])
  const totalMs = useMemo(() => sumDurations(segments), [segments])
  const rounds = useMemo(() => totalRounds(segments), [segments])
  const cues = useMemo(() => createCueScheduler(), [])
  const openEnded = segments.length === 0 || segments[segments.length - 1]?.duration === null

  const [status, setStatus] = useState<RunnerStatus>('idle')
  const [elapsedMs, setElapsedMs] = useState(0)
  const [laps, setLaps] = useState<number[]>([])

  // shifted forward on resume, so the elapsed time is always a plain subtraction
  const startedAt = useRef<number | null>(null)
  const pausedAt = useRef<number | null>(null)

  const start = useCallback(() => {
    unlockAudio()
    startedAt.current = Date.now()
    pausedAt.current = null
    cues.reset()
    setLaps([])
    setElapsedMs(0)
    setStatus('running')
  }, [cues])

  const pause = useCallback(() => {
    if (startedAt.current === null) return
    pausedAt.current = Date.now()
    setStatus('paused')
  }, [])

  const resume = useCallback(() => {
    if (startedAt.current !== null && pausedAt.current !== null) {
      startedAt.current += Date.now() - pausedAt.current
      pausedAt.current = null
    }
    setStatus('running')
  }, [])

  const stop = useCallback(() => {
    setStatus('done')
  }, [])

  const lap = useCallback(() => {
    if (startedAt.current === null) return
    const elapsed = Date.now() - startedAt.current
    // the phone is on the floor, a sound is the only confirmation the athlete gets
    playCue('tick')
    setLaps((current) => [...current, elapsed - segmentStart(elapsed, bounds)])
  }, [bounds])

  useEffect(() => {
    if (status !== 'running') return
    let frame = 0

    const loop = () => {
      const started = startedAt.current
      if (started !== null) {
        const elapsed = Date.now() - started
        if (!openEnded && elapsed >= totalMs) {
          playCue('end')
          setElapsedMs(totalMs)
          setStatus('done')
          return
        }
        const index = segmentAt(elapsed, bounds)
        const end = bounds[index] ?? 0
        cues.tick(index, segments[index]?.kind ?? 'work', Number.isFinite(end) ? end - elapsed : 0)
        setElapsedMs((previous) =>
          Math.floor(elapsed / TICK_MS) === Math.floor(previous / TICK_MS) ? previous : elapsed,
        )
      }
      frame = requestAnimationFrame(loop)
    }

    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [status, bounds, segments, totalMs, openEnded, cues])

  const index = segmentAt(elapsedMs, bounds)
  const segment = index === -1 ? null : (segments[index] ?? null)
  const end = index === -1 ? 0 : (bounds[index] ?? 0)
  const durationMs = segment?.duration == null ? null : segment.duration * 1000
  const segmentElapsedMs = index === -1 ? elapsedMs : elapsedMs - segmentStart(elapsedMs, bounds)
  // the session an athlete reads is the clocked stretch alone, not the warm-up around it
  const clocked = clockedIndex(segments)
  const clockedFrom = clocked <= 0 ? 0 : (bounds[clocked - 1] ?? 0)
  const clockedTo = clocked === -1 ? totalMs : (bounds[clocked] ?? Number.POSITIVE_INFINITY)

  return {
    status,
    elapsedMs,
    sessionMs: Math.max(0, Math.min(elapsedMs, clockedTo) - clockedFrom),
    totalMs,
    segment,
    nextSegment: index === -1 ? null : (segments[index + 1] ?? null),
    segmentRemainingMs: durationMs === null ? 0 : Math.max(0, end - elapsedMs),
    segmentProgress:
      durationMs === null || durationMs === 0
        ? 0
        : Math.min(1, Math.max(0, segmentElapsedMs / durationMs)),
    round: clocked === -1 ? (segment?.round ?? 0) : laps.length,
    rounds,
    laps,
    openEnded,
    completed: status === 'done' && !openEnded && elapsedMs >= totalMs,
    start,
    pause,
    resume,
    stop,
    lap,
  }
}

function sumDurations(segments: Segment[]): number {
  return segments.reduce((total, segment) => total + (segment.duration ?? 0) * 1000, 0)
}

function cumulativeBounds(segments: Segment[]): number[] {
  let total = 0
  return segments.map((segment) => {
    if (segment.duration === null) return Number.POSITIVE_INFINITY
    total += segment.duration * 1000
    return total
  })
}

function segmentAt(elapsedMs: number, bounds: number[]): number {
  const index = bounds.findIndex((bound) => elapsedMs < bound)
  return index === -1 ? bounds.length - 1 : index
}

function segmentStart(elapsedMs: number, bounds: number[]): number {
  const index = segmentAt(elapsedMs, bounds)
  return index <= 0 ? 0 : (bounds[index - 1] ?? 0)
}
