import type { SegmentKind } from '../domain/timer.ts'
import { playCue } from './cues.ts'

export type CueScheduler = {
  reset: () => void
  tick: (index: number, kind: SegmentKind, remainingMs: number) => void
}

// one cue per transition and per counted second, so coming back from sleep never fires a burst
export function createCueScheduler(): CueScheduler {
  let lastSegment = -1
  let lastTick = ''

  return {
    reset() {
      lastSegment = -1
      lastTick = ''
    },

    tick(index, kind, remainingMs) {
      if (index === -1) return

      if (index !== lastSegment) {
        lastSegment = index
        playCue(kind === 'work' ? 'go' : 'rest')
        return
      }

      const remaining = Math.ceil(Math.max(0, remainingMs) / 1000)
      if (remaining > 0 && remaining <= 3) {
        const key = `${index}:${remaining}`
        if (key !== lastTick) {
          lastTick = key
          playCue('tick')
        }
      }
    },
  }
}
