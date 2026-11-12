import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TimerKind } from '../domain/timer.ts'

export type Session = {
  id: string
  timerId: string
  name: string
  kind: TimerKind
  startedAt: string
  elapsedMs: number
  roundsDone: number
  laps: number[]
  completed: boolean
}

type HistoryState = {
  sessions: Session[]
  add: (session: Session) => void
  remove: (id: string) => void
  clear: () => void
}

export const useHistory = create<HistoryState>()(
  persist(
    (set) => ({
      sessions: [],
      add: (session) => set((state) => ({ sessions: [session, ...state.sessions].slice(0, 200) })),
      remove: (id) => set((state) => ({ sessions: state.sessions.filter((item) => item.id !== id) })),
      clear: () => set({ sessions: [] }),
    }),
    { name: 'tikka.history', version: 1 },
  ),
)
