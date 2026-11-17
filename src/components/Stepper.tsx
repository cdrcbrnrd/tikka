import { useEffect, useRef, useState } from 'react'
import styles from './Stepper.module.css'

type Props = {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  format?: (value: number) => string
  stepFor?: (value: number, direction: 1 | -1) => number
  parse?: (text: string) => number | null
}

const HOLD_DELAY = 400
const HOLD_RATE = 90

export default function Stepper({
  label,
  value,
  min,
  max,
  onChange,
  format = String,
  stepFor = () => 1,
  parse,
}: Props) {
  const [typed, setTyped] = useState<string | null>(null)
  const latest = useRef(value)
  const release = useRef<(() => void) | null>(null)

  useEffect(() => {
    latest.current = value
  }, [value])

  const clamp = (n: number) => Math.min(max, Math.max(min, n))

  const stopHold = () => {
    release.current?.()
    release.current = null
  }

  useEffect(() => stopHold, [])

  // the repeat reads the ref, a closure over the prop would keep applying the same step
  const bump = (direction: 1 | -1) => {
    const current = latest.current
    const next = clamp(current + direction * stepFor(current, direction))
    if (next === current) {
      stopHold()
      return
    }
    latest.current = next
    onChange(next)
  }

  const commit = (text: string) => {
    const parsed = parse?.(text) ?? null
    if (parsed !== null) onChange(clamp(parsed))
    setTyped(null)
  }

  const startHold = (direction: 1 | -1) => {
    stopHold()
    bump(direction)

    let repeat: number | undefined
    const delay = setTimeout(() => {
      repeat = setInterval(() => bump(direction), HOLD_RATE)
    }, HOLD_DELAY)

    const stop = () => {
      clearTimeout(delay)
      clearInterval(repeat)
      window.removeEventListener('pointerup', stop)
    }

    release.current = stop
    // the button can become disabled mid-hold and then never sees the release
    window.addEventListener('pointerup', stop)
  }

  return (
    <div className="field">
      {/* the label column is what is left over, and a wrapped label makes its row taller */}
      <span className="subtle">{label}</span>
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.step}
          aria-label={`Diminuer ${label}`}
          disabled={value <= min}
          onPointerDown={() => startHold(-1)}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
        >
          −
        </button>
        {typed === null && parse === undefined ? (
          <span className={`${styles.value} digits`}>{format(value)}</span>
        ) : typed === null ? (
          <button
            type="button"
            className={`${styles.value} digits`}
            aria-label={`Saisir ${label}`}
            onClick={() => setTyped(format(value))}
          >
            {format(value)}
          </button>
        ) : (
          <input
            className={`${styles.value} ${styles.typing} digits`}
            type="text"
            inputMode="numeric"
            aria-label={label}
            value={typed}
            autoFocus
            // the whole value goes on the first keystroke, nothing to erase before typing
            onFocus={(event) => event.target.select()}
            onChange={(event) => setTyped(event.target.value)}
            onBlur={(event) => commit(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commit(event.currentTarget.value)
              if (event.key === 'Escape') setTyped(null)
            }}
          />
        )}
        <button
          type="button"
          className={styles.step}
          aria-label={`Augmenter ${label}`}
          disabled={value >= max}
          onPointerDown={() => startHold(1)}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
        >
          +
        </button>
      </div>
    </div>
  )
}
