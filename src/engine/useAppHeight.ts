import { useEffect } from 'react'

// an installed app gets a stale viewport height on its first paint, and iOS only
// refreshes it once the athlete scrolls: measuring it ourselves closes the gap
export function useAppHeight(): void {
  useEffect(() => {
    let applied = 0
    let frame = 0

    const apply = () => {
      frame = 0
      // a keyboard shrinks the window on Android, the screen must not follow while typing
      if (document.activeElement instanceof HTMLInputElement) return
      // iOS fires resize in bursts, and the property is inherited by the whole document
      if (window.innerHeight === applied) return
      applied = window.innerHeight
      document.documentElement.style.setProperty('--app-height', `${applied}px`)
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
