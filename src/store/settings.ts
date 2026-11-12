import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type SettingsState = {
  ringInSilentMode: boolean
  setRingInSilentMode: (value: boolean) => void
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ringInSilentMode: false,
      setRingInSilentMode: (ringInSilentMode) => set({ ringInSilentMode }),
    }),
    { name: 'tikka.settings', version: 1 },
  ),
)
