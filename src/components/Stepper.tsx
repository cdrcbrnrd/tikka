import { useCallback, useEffect, useRef } from 'react'
import styles from './Stepper.module.css'

type Props = {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  format: (value: number) => string
  stepFor?: (value: number) => number
}

const HOLD_DELAY = 400
const HOLD_RATE = 90

export default function Stepper({ label, value, min, max, onChange, format, stepFor }: Props) {
  const latest = useRef(value)
  const timeout = useRef<number | undefined>(undefined)
  const interval = useRef<number | undefined>(undefined)

  useEffect(() => {
    latest.current = value
  }, [value])

  const stopHold = useCallback(() => {
    clearTimeout(timeout.current)
    clearInterval(interval.current)
    timeout.current = undefined
    interval.current = undefined
    window.removeEventListener('pointerup', stopHold)
  }, [])

  useEffect(() => stopHold, [stopHold])

  // the repeat reads the ref, a closure over the prop would keep applying the same step
  const bump = (direction: 1 | -1) => {
    const current = latest.current
    const step = stepFor ? stepFor(current) : 1
    const next = Math.min(max, Math.max(min, current + direction * step))
    if (next === current) {
      stopHold()
      return
    }
    latest.current = next
    onChange(next)
  }

  const startHold = (direction: 1 | -1) => {
    stopHold()
    bump(direction)
    // the button can become disabled mid-hold, so the release is caught on the window too
    window.addEventListener('pointerup', stopHold)
    timeout.current = setTimeout(() => {
      interval.current = setInterval(() => bump(direction), HOLD_RATE)
    }, HOLD_DELAY)
  }

  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.step}
          aria-label={`Diminuer ${label}`}
          disabled={value <= min}
          onPointerDown={() => startHold(-1)}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
        >
          −
        </button>
        <span className={`${styles.value} digits`}>{format(value)}</span>
        <button
          type="button"
          className={styles.step}
          aria-label={`Augmenter ${label}`}
          disabled={value >= max}
          onPointerDown={() => startHold(1)}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
        >
          +
        </button>
      </div>
    </div>
  )
}
