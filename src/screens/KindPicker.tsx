import { Link } from 'react-router-dom'
import BackLink from '../components/BackLink.tsx'
import Icon, { type IconName } from '../components/Icon.tsx'
import { KIND_GROUPS, KIND_HINTS, KIND_LABELS, type TimerKind } from '../domain/timer.ts'
import styles from './KindPicker.module.css'

// a record rather than a lookup, so a ninth kind cannot reach the list without a glyph
const KIND_ICONS: Record<TimerKind, IconName> = {
  stopwatch: 'timer',
  countdown: 'hourglass',
  rest: 'coffee',
  intervals: 'repeat',
  tabata: 'bolt',
  circuit: 'list',
  ladder: 'climb',
  emom: 'alarm',
  exmom: 'reset',
  amrap: 'loop',
  fortime: 'flag',
}

export default function KindPicker() {
  return (
    <div className="screen">
      <header className="screen-intro">
        <BackLink to="/" label="Mes chronos" />
        <h1 className="title">Nouveau chrono</h1>
        <span className="subtle">Choisis un type de séance.</span>
      </header>

      <div className={`${styles.families} grow`}>
        {KIND_GROUPS.map((family) => (
          <div key={family.label} className={styles.family}>
            <span className="group-label">{family.label}</span>
            {family.kinds.map((kind) => (
              <Link key={kind} to={`/chrono/nouveau/${kind}`} className={styles.row}>
                <span className={styles.rowIcon}>
                  <Icon name={KIND_ICONS[kind]} size={26} />
                </span>
                <span className={styles.rowText}>
                  <span className={styles.rowName}>{KIND_LABELS[kind]}</span>
                  <span className="subtle">{KIND_HINTS[kind]}</span>
                </span>
                <span className={styles.rowIcon}>
                  <Icon name="go" />
                </span>
              </Link>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
