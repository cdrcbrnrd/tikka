import type { ReactNode } from 'react'
import styles from './ProgressRing.module.css'

const RADIUS = 46
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

type Props = {
  progress: number
  tone: 'accent' | 'calm'
  children: ReactNode
}

export default function ProgressRing({ progress, tone, children }: Props) {
  const offset = CIRCUMFERENCE * (1 - progress)

  return (
    <div className={styles.wrap}>
      <svg className={styles.svg} viewBox="0 0 100 100" aria-hidden="true">
        <circle className={styles.track} cx="50" cy="50" r={RADIUS} fill="none" strokeWidth="2.5" />
        <circle
          className={`${styles.arc} ${styles[tone]}`}
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          strokeWidth="2.5"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <div className={styles.inner}>{children}</div>
    </div>
  )
}
