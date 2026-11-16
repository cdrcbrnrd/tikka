import { useEffect, useRef } from 'react'
import styles from './Stepper.module.css'

type Props = {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  format?: (value: number) => string
  stepFor?: (value: number, direction: 1 | -1) => number
  suggested?: boolean
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
  suggested = false,
}: Props) {
  const latest = useRef(value)
  const release = useRef<(() => void) | null>(null)

  useEffect(() => {
    latest.current = value
  }, [value])

  const stopHold = () => {
    release.current?.()
    release.current = null
  }

  useEffect(() => stopHold, [])

  // the repeat reads the ref, a closure over the prop would keep applying the same step
  const bump = (direction: 1 | -1) => {
    const current = latest.current
    const next = Math.min(max, Math.max(min, current + direction * stepFor(current, direction)))
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
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
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
        <span className={`${styles.value} digits ${suggested ? 'muted' : ''}`}>
          {format(value)}
        </span>
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
