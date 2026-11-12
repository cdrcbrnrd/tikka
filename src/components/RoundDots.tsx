import styles from './RoundDots.module.css'

type Props = { round: number; rounds: number }

export default function RoundDots({ round, rounds }: Props) {
  if (rounds < 2 || rounds > 12) return null

  return (
    <div className={styles.dots} aria-hidden="true">
      {Array.from({ length: rounds }, (_, index) => {
        const position = index + 1
        const state = position === round ? styles.current : position < round ? styles.done : ''
        return <span key={position} className={`${styles.dot} ${state}`} />
      })}
    </div>
  )
}
