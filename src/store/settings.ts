import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_THEME, THEMES, type ThemeId } from '../domain/theme.ts'

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
    {
      name: 'tikka.settings',
      version: 3,
      // a phone that still holds a removed ambiance shows none selected in the settings
      migrate: (state) => {
        const theme = (state as Partial<SettingsState>).theme
        return { theme: THEMES.some((item) => item.id === theme) ? theme : DEFAULT_THEME }
      },
    },
  ),
)
