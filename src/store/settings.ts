import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_THEME, type ThemeId } from '../domain/theme.ts'

type SettingsState = {
  theme: ThemeId
  setTheme: (theme: ThemeId) => void
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      theme: DEFAULT_THEME,
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'tikka.settings', version: 2 },
  ),
)
