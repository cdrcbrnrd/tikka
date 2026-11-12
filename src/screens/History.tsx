import { useState } from 'react'
import BackLink from '../components/BackLink.tsx'
import Button from '../components/Button.tsx'
import Confirm from '../components/Confirm.tsx'
import { clock, clockTenths, plural, sessionDate, sessionTime, splits } from '../domain/format.ts'
import { useHistory, type Session } from '../store/history.ts'
import styles from './History.module.css'

export default function History() {
  const sessions = useHistory((state) => state.sessions)
  const clear = useHistory((state) => state.clear)
  const [open, setOpen] = useState<string | null>(null)
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
              <h2 className={styles.dayLabel}>{label}</h2>
              <ul className={styles.list}>
                {entries.map((session) => {
                  const hasLaps = session.laps.length > 0
                  return (
                  <li key={session.id} className={styles.entry}>
                    <button
                      type="button"
                      className={`${styles.summary} ${hasLaps ? '' : styles.flat}`}
                      aria-expanded={hasLaps ? open === session.id : undefined}
                      disabled={!hasLaps}
                      onClick={() => setOpen((current) => (current === session.id ? null : session.id))}
                    >
                      <span className={styles.left}>
                        <span className={`${styles.name} wordmark`}>{session.name}</span>
                        <span className="subtle">{detail(session)}</span>
                      </span>
                      <span className={styles.right}>
                        <span className={`${styles.duration} digits readout segments`}>{clock(session.elapsedMs / 1000)}</span>
                        <span className={`subtle digits ${styles.hour}`}>{sessionTime(session.startedAt)}</span>
                      </span>
                    </button>

                    {hasLaps && open === session.id && (
                      <ol className={styles.laps}>
                        {splits(session.laps).map((split, index) => (
                          <li key={index} className={styles.lap}>
                            <span className="muted">Tour {index + 1}</span>
                            <span className="digits">{clockTenths(split)}</span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </li>
                  )
                })}
              </ul>
            </section>
          ))}

          <div className={styles.footer}>
            <Button variant="ghost" onClick={() => setAskClear(true)}>
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
  if (session.roundsDone > 0) parts.push(plural(session.roundsDone, 'round'))
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
