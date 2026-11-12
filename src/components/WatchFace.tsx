import { memo } from 'react'
import { pad } from '../domain/format.ts'
import styles from './WatchFace.module.css'

const GAUGE_CELLS = 24

// the printed parts of the case never change, they are built once for the whole session
const BARS = (
  <span className={styles.bars} aria-hidden="true">
    {Array.from({ length: 4 }, (_, index) => (
      <span key={index} className={styles.bar} />
    ))}
  </span>
)

const BOTTOM_LEGEND = <Legend marker="Arrêter" kind="Round · Tour · Total" />

type Props = {
  model: string
  kind: string
  phase: string
  round: number
  rounds: number
  time: string
  progress: number
  urgent: boolean
  badge: string
  openEnded: boolean
}

function WatchFace({ model, kind, phase, round, rounds, time, progress, urgent, badge, openEnded }: Props) {
  return (
    <div className={styles.face}>
      <div className={styles.brand}>
        <span className={styles.wordmark}>TIKKA</span>
        <span className={styles.model}>{model}</span>
      </div>
      <div className={styles.rule} />

      <Legend marker="Pause" kind={`Chrono ${kind}`} />

      <div className={styles.panel}>
        <div className={styles.strip}>
          {BARS}
          <span className={styles.phase}>{phase}</span>
          <span>{rounds > 1 ? pad(Math.max(1, round)) : ''}</span>
        </div>

        <div className={styles.readout}>
          <span className={styles.ghost} aria-hidden="true">
            {ghostOf(time)}
          </span>
          <span className={`${styles.live} ${urgent ? styles.urgent : ''}`}>{time}</span>
        </div>

        <Gauge filled={Math.round(progress * GAUGE_CELLS)} />
      </div>

      {BOTTOM_LEGEND}

      <div className={styles.baseline}>
        <span>{openEnded ? 'Tours' : 'Total'}</span>
        <span className={styles.badge}>{badge}</span>
        <span>{openEnded ? 'Marqués' : 'Restant'}</span>
      </div>
    </div>
  )
}

export default memo(WatchFace)

function Legend({ marker, kind }: { marker: string; kind: string }) {
  return (
    <div className={styles.legend}>
      <span className={styles.marker}>
        <span className={styles.arrow} aria-hidden="true" />
        {marker}
      </span>
      <span className={styles.kind}>{kind}</span>
    </div>
  )
}

// a cell lights up a few times a minute, the runner redraws ten times a second
const Gauge = memo(function Gauge({ filled }: { filled: number }) {
  return (
    <div className={styles.gauge} aria-hidden="true">
      {Array.from({ length: GAUGE_CELLS }, (_, index) => (
        <span key={index} className={`${styles.cell} ${index < filled ? styles.cellOn : ''}`} />
      ))}
    </div>
  )
})

// an unlit panel shows an eight wherever a digit can appear
function ghostOf(time: string): string {
  return time.replace(/\d/g, '8')
}
