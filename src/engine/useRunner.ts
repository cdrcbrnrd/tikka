import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { buildSegments, totalRounds, type Segment, type Timer } from '../domain/timer.ts'
import { playCue, unlockAudio } from './cues.ts'

export type RunnerStatus = 'idle' | 'running' | 'paused' | 'done'

export type RunnerView = {
  status: RunnerStatus
  elapsedMs: number
  totalMs: number
  segment: Segment | null
  nextSegment: Segment | null
  segmentIndex: number
  segmentRemainingMs: number
  segmentProgress: number
  round: number
  rounds: number
  laps: number[]
  openEnded: boolean
  completed: boolean
}

export type Runner = RunnerView & {
  start: () => void
  pause: () => void
  resume: () => void
  stop: () => void
  lap: () => void
}

export function useRunner(timer: Timer): Runner {
  const segments = useMemo(() => buildSegments(timer), [timer])
  const bounds = useMemo(() => cumulativeBounds(segments), [segments])
  const totalMs = bounds.length > 0 ? bounds[bounds.length - 1]! : 0
  const openEnded = segments.length === 0 || timer.kind === 'stopwatch'

  const [status, setStatus] = useState<RunnerStatus>('idle')
  const [elapsedMs, setElapsedMs] = useState(0)
  const [laps, setLaps] = useState<number[]>([])
  const [completed, setCompleted] = useState(false)

  const startedAt = useRef<number | null>(null)
  const pausedTotal = useRef(0)
  const pausedAt = useRef<number | null>(null)
  const lastSegment = useRef(-1)
  const lastTick = useRef('')

  const start = useCallback(() => {
    unlockAudio()
    startedAt.current = Date.now()
    pausedTotal.current = 0
    pausedAt.current = null
    lastSegment.current = 0
    lastTick.current = ''
    setLaps([])
    setElapsedMs(0)
    setCompleted(false)
    setStatus('running')
  }, [])

  const pause = useCallback(() => {
    if (startedAt.current === null) return
    pausedAt.current = Date.now()
    setStatus('paused')
  }, [])

  const resume = useCallback(() => {
    if (pausedAt.current !== null) {
      pausedTotal.current += Date.now() - pausedAt.current
      pausedAt.current = null
    }
    setStatus('running')
  }, [])

  const stop = useCallback(() => {
    setStatus('done')
  }, [])

  const lap = useCallback(() => {
    if (startedAt.current === null) return
    setLaps((current) => [...current, Date.now() - startedAt.current! - pausedTotal.current])
  }, [])

  useEffect(() => {
    if (status !== 'running') return
    let frame = 0

    const loop = () => {
      const started = startedAt.current
      if (started !== null) {
        const elapsed = Date.now() - started - pausedTotal.current
        const finished = !openEnded && elapsed >= totalMs
        setElapsedMs(finished ? totalMs : elapsed)
        if (finished) {
          playCue('end')
          setCompleted(true)
          setStatus('done')
          return
        }
        announce(elapsed, bounds, segments, lastSegment, lastTick)
      }
      frame = requestAnimationFrame(loop)
    }

    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [status, bounds, segments, totalMs, openEnded])

  const view = useMemo<RunnerView>(() => {
    const index = segmentAt(elapsedMs, bounds)
    const segment = index === -1 ? null : (segments[index] ?? null)
    const end = index === -1 ? 0 : (bounds[index] ?? 0)
    const duration = segment ? segment.duration * 1000 : 0
    const start = end - duration
    return {
      status,
      elapsedMs,
      totalMs,
      segment,
      nextSegment: index === -1 ? null : (segments[index + 1] ?? null),
      segmentIndex: index,
      segmentRemainingMs: segment ? Math.max(0, end - elapsedMs) : 0,
      segmentProgress: duration > 0 ? Math.min(1, Math.max(0, (elapsedMs - start) / duration)) : 0,
      round: segment?.round ?? 0,
      rounds: totalRounds(segments),
      laps,
      openEnded,
      completed,
    }
  }, [status, elapsedMs, totalMs, bounds, segments, laps, openEnded, completed])

  return { ...view, start, pause, resume, stop, lap }
}

function cumulativeBounds(segments: Segment[]): number[] {
  let total = 0
  return segments.map((segment) => {
    total += segment.duration * 1000
    return total
  })
}

function segmentAt(elapsedMs: number, bounds: number[]): number {
  for (let i = 0; i < bounds.length; i += 1) {
    if (elapsedMs < bounds[i]!) return i
  }
  return bounds.length === 0 ? -1 : bounds.length - 1
}

// one cue per transition and per counted second, so coming back from sleep never fires a burst
function announce(
  elapsedMs: number,
  bounds: number[],
  segments: Segment[],
  lastSegment: { current: number },
  lastTick: { current: string },
): void {
  const index = segmentAt(elapsedMs, bounds)
  if (index === -1) return

  if (index !== lastSegment.current) {
    lastSegment.current = index
    playCue(segments[index]?.kind === 'rest' ? 'rest' : 'go')
    return
  }

  const remaining = Math.ceil(Math.max(0, bounds[index]! - elapsedMs) / 1000)
  if (remaining > 0 && remaining <= 3) {
    const key = `${index}:${remaining}`
    if (key !== lastTick.current) {
      lastTick.current = key
      playCue('tick')
    }
  }
}
