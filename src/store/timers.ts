import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Timer } from '../domain/timer.ts'

const PRESETS: Timer[] = [
  { id: 'preset-rameur', name: 'Rameur 8 × 500 m', kind: 'intervals', prepare: 10, work: 120, rest: 60, rounds: 8 },
  { id: 'preset-emom', name: 'EMOM 12', kind: 'emom', prepare: 10, period: 60, rounds: 12 },
  { id: 'preset-amrap', name: 'AMRAP 20', kind: 'countdown', prepare: 10, duration: 1200 },
  { id: 'preset-chrono', name: 'Chrono libre', kind: 'stopwatch', prepare: 0 },
]

type TimersState = {
  timers: Timer[]
  upsert: (timer: Timer) => void
  remove: (id: string) => void
}

export const useTimers = create<TimersState>()(
  persist(
    (set) => ({
      timers: PRESETS,
      upsert: (timer) =>
        set((state) => {
          const index = state.timers.findIndex((item) => item.id === timer.id)
          if (index === -1) return { timers: [...state.timers, timer] }
          const timers = [...state.timers]
          timers[index] = timer
          return { timers }
        }),
      remove: (id) => set((state) => ({ timers: state.timers.filter((item) => item.id !== id) })),
    }),
    { name: 'tikka.timers', version: 1 },
  ),
)

export function useTimer(id: string | undefined): Timer | undefined {
  return useTimers((state) => state.timers.find((item) => item.id === id))
}
