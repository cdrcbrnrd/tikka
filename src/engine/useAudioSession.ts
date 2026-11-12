import { useEffect } from 'react'

type AudioSession = { type: string }

function audioSession(): AudioSession | undefined {
  return (navigator as Navigator & { audioSession?: AudioSession }).audioSession
}

// web audio goes out on the ambient channel, which the iPhone silent switch mutes
export function useAudioSession(playback: boolean): void {
  useEffect(() => {
    const session = audioSession()
    if (!playback || !session) return
    session.type = 'playback'
    // back to the default on the way out, so music apps are not held off the device
    return () => {
      session.type = 'auto'
    }
  }, [playback])
}
