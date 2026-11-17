export type Cue = 'tick' | 'go' | 'rest' | 'block' | 'end'

type Shape = { freq: number; duration: number; gain: number; repeats: number; gap: number }

const SHAPES: Record<Cue, Shape> = {
  tick: { freq: 880, duration: 0.09, gain: 0.25, repeats: 1, gap: 0 },
  go: { freq: 1320, duration: 0.22, gain: 0.4, repeats: 1, gap: 0 },
  rest: { freq: 523, duration: 0.22, gain: 0.3, repeats: 1, gap: 0 },
  // lower and doubled, because a rest between blocks is long enough to sit down for
  block: { freq: 392, duration: 0.26, gain: 0.3, repeats: 2, gap: 0.3 },
  end: { freq: 1320, duration: 0.18, gain: 0.4, repeats: 3, gap: 0.26 },
}

const VIBRATIONS: Record<Cue, number | number[]> = {
  tick: 30,
  go: 120,
  rest: 60,
  block: [90, 90, 90],
  end: [120, 90, 120, 90, 240],
}

let context: AudioContext | null = null

// iOS only lets audio through once a context has been resumed inside a user gesture
export function unlockAudio(): void {
  context ??= new AudioContext()
  if (context.state === 'suspended') void context.resume()
  tone(440, 0.01, 0)
}

export function playCue(cue: Cue): void {
  const shape = SHAPES[cue]
  for (let i = 0; i < shape.repeats; i += 1) {
    tone(shape.freq, shape.duration, shape.gain, i * shape.gap)
  }
  if (typeof navigator.vibrate === 'function') navigator.vibrate(VIBRATIONS[cue])
}

export function releaseAudio(): void {
  const closing = context
  context = null
  // the end cue lasts about a second, closing right away would cut it off
  setTimeout(() => void closing?.close(), 1200)
}

function tone(freq: number, duration: number, gain: number, delay = 0): void {
  if (!context) return
  const start = context.currentTime + delay
  const osc = context.createOscillator()
  const volume = context.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  volume.gain.setValueAtTime(0.0001, start)
  volume.gain.linearRampToValueAtTime(Math.max(gain, 0.0001), start + 0.012)
  volume.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(volume).connect(context.destination)
  osc.start(start)
  osc.stop(start + duration + 0.02)
}
