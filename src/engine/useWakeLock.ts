import { useEffect } from 'react'

type Sentinel = { released: boolean; release: () => Promise<void> }
type WakeLockApi = { request: (type: 'screen') => Promise<Sentinel> }

// not supported everywhere, the session just runs with the usual screen timeout then
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    const api = (navigator as unknown as { wakeLock?: WakeLockApi }).wakeLock
    if (!active || !api) return

    let sentinel: Sentinel | null = null
    let cancelled = false

    const acquire = async () => {
      try {
        const next = await api.request('screen')
        if (cancelled) {
          void next.release()
          return
        }
        sentinel = next
      } catch {
        sentinel = null
      }
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible' && (sentinel === null || sentinel.released)) {
        void acquire()
      }
    }

    void acquire()
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      void sentinel?.release()
    }
  }, [active])
}
