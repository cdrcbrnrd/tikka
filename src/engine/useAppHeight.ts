import { useEffect } from 'react'

// an installed app gets a stale viewport height on its first paint, and iOS only
// refreshes it once the athlete scrolls: measuring it ourselves closes the gap
export function useAppHeight(): void {
  useEffect(() => {
    let applied = 0
    let frame = 0

    const insetTop = () => {
      const probe = document.createElement('div')
      probe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:env(safe-area-inset-top)'
      document.body.append(probe)
      const height = probe.getBoundingClientRect().height
      probe.remove()
      return height
    }

    const apply = () => {
      frame = 0
      // a keyboard shrinks the window on Android, the screen must not follow while typing
      if (document.activeElement instanceof HTMLInputElement) return
      // iOS fires resize in bursts, and the property is inherited by the whole document
      if (window.innerHeight === applied) return
      applied = window.innerHeight
      const root = document.documentElement.style
      root.setProperty('--app-height', `${applied}px`)
      // the browser reports the insets against the screen, but hands the installed app a view
      // that stops short of it by exactly the status bar, and that band clears the indicator
      const band = window.screen.height - applied
      root.setProperty('--screen-gap', `${Math.abs(band - insetTop()) <= 1 ? band : 0}px`)
    }

    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(apply)
    }

    apply()
    schedule()
    window.addEventListener('resize', schedule)
    window.addEventListener('orientationchange', schedule)
    window.addEventListener('pageshow', schedule)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', schedule)
      window.removeEventListener('orientationchange', schedule)
      window.removeEventListener('pageshow', schedule)
    }
  }, [])
}
