import { useEffect } from 'react'
import { hasDial, THEMES } from '../domain/theme.ts'
import { useSettings } from '../store/settings.ts'

// the status bar of an installed app reads the meta, not the stylesheet
export function useTheme(): void {
  const theme = useSettings((state) => state.theme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    const meta = document.querySelector('meta[name="theme-color"]')
    const background = THEMES.find((item) => item.id === theme)?.swatch[0]
    if (meta && background) meta.setAttribute('content', background)

    // the segment faces only load on first paint otherwise, in the middle of a session
    if (hasDial(theme)) {
      void document.fonts.load('700 1rem Segments')
      void document.fonts.load('700 1rem SegmentsText')
    }
  }, [theme])
}
