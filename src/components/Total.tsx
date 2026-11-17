import { totalShort, type Timer } from '../domain/timer.ts'
import styles from './Total.module.css'

// an open-ended timer has no total, and the line it sits on then closes up on its own
export default function Total({ timer }: { timer: Timer }) {
  const total = totalShort(timer)
  if (!total) return null
  return <span className={`${styles.total} digits`}>{total}</span>
}
