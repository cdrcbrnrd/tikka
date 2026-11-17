import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Timer } from '../domain/timer.ts'

type TimersState = {
  timers: Timer[]
  upsert: (timer: Timer) => void
  remove: (id: string) => void
}

export const useTimers = create<TimersState>()(
  persist(
    (set) => ({
      timers: [],
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
    // a kind the running bundle cannot expand would crash the home screen, and the installed app
    // serves the previous one until a cold start: every new kind raises this, and starts from empty
    { name: 'tikka.timers', version: 3, migrate: () => ({ timers: [] }) },
  ),
)

export function useTimer(id: string | undefined): Timer | undefined {
  return useTimers((state) => state.timers.find((item) => item.id === id))
}
