import { useState } from 'react'
import BackLink from '../components/BackLink.tsx'
import Button from '../components/Button.tsx'
import Confirm from '../components/Confirm.tsx'
import { clock, plural, sessionDate } from '../domain/format.ts'
import { useHistory, type Session } from '../store/history.ts'
import styles from './History.module.css'

export default function History() {
  const sessions = useHistory((state) => state.sessions)
  const clear = useHistory((state) => state.clear)
  const [askClear, setAskClear] = useState(false)

  const days = groupByDay(sessions)

  return (
    <div className="screen">
      <header className="screen-head">
        <div>
          <BackLink to="/" label="Mes chronos" />
          <h1 className="title">Historique</h1>
        </div>
      </header>

      {sessions.length === 0 ? (
        <div className="empty grow">
          <p>Aucune séance enregistrée.</p>
          <p className="subtle">Les séances arrivent ici dès qu’un chrono est allé au bout.</p>
        </div>
      ) : (
        <div className={`grow ${styles.body}`}>
          {days.map(([label, entries]) => (
            <section key={label} className={styles.day}>
              <h2 className="group-label">{label}</h2>
              <ul className={styles.list}>
                {entries.map((session) => (
                  <li key={session.id} className={styles.entry}>
                    <span className="line">
                      <span className={`${styles.name} one-line`}>{session.name}</span>
                      <span className={`${styles.duration} digits`}>{clock(session.elapsedMs / 1000)}</span>
                    </span>
                    <span className="subtle one-line">{detail(session)}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <div className={`screen-footer ${styles.footer}`}>
            <Button variant="accent" block onClick={() => setAskClear(true)}>
              Vider l’historique
            </Button>
          </div>
        </div>
      )}

      {askClear && (
        <Confirm
          title="Vider l’historique ?"
          detail="Toutes les séances enregistrées seront perdues. Les chronos restent."
          confirmLabel="Vider"
          onCancel={() => setAskClear(false)}
          onConfirm={() => {
            clear()
            setAskClear(false)
          }}
        />
      )}
    </div>
  )
}

function detail(session: Session): string {
  const parts: string[] = []
  if (session.roundsDone > 0 && session.roundsDone !== session.laps.length)
    parts.push(plural(session.roundsDone, 'round'))
  if (session.laps.length > 0) parts.push(plural(session.laps.length, 'tour'))
  if (!session.completed) parts.push('arrêtée en route')
  return parts.join(' · ')
}

function groupByDay(sessions: Session[]): [string, Session[]][] {
  const days = new Map<string, Session[]>()
  for (const session of sessions) {
    const label = dayLabel(session.startedAt)
    const bucket = days.get(label)
    if (bucket) bucket.push(session)
    else days.set(label, [session])
  }
  return [...days.entries()]
}

function dayLabel(iso: string): string {
  const day = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (day.toDateString() === today.toDateString()) return 'Aujourd’hui'
  if (day.toDateString() === yesterday.toDateString()) return 'Hier'
  return sessionDate(iso)
}
