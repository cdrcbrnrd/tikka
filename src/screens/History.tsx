import { useState } from 'react'
import BackLink from '../components/BackLink.tsx'
import Confirm from '../components/Confirm.tsx'
import { clock, clockTenths, sessionDate, sessionTime } from '../domain/format.ts'
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
        <div className="grow">
          {days.map(([label, entries]) => (
            <section key={label} className={styles.day}>
              <h2 className={styles.dayLabel}>{label}</h2>
              <ul className={styles.list}>
                {entries.map((session) => (
                  <li key={session.id} className={styles.entry}>
                    <button
                      type="button"
                      className={`${styles.summary} ${session.laps.length === 0 ? styles.flat : ''}`}
                      aria-expanded={session.laps.length > 0 ? open === session.id : undefined}
                      disabled={session.laps.length === 0}
                      onClick={() => setOpen((current) => (current === session.id ? null : session.id))}
                    >
                      <span className={styles.left}>
                        <span className={styles.name}>{session.name}</span>
                        <span className="subtle">{detail(session)}</span>
                      </span>
                      <span className={styles.right}>
                        <span className={`${styles.duration} digits`}>{clock(session.elapsedMs / 1000)}</span>
                        <span className="subtle digits">{sessionTime(session.startedAt)}</span>
                      </span>
                    </button>

                    {open === session.id && session.laps.length > 0 && (
                      <ol className={styles.laps}>
                        {session.laps.map((lap, index) => (
                          <li key={index} className={styles.lap}>
                            <span className="muted">Tour {index + 1}</span>
                            <span className="digits">{clockTenths(lap - (session.laps[index - 1] ?? 0))}</span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <div className={styles.footer}>
            <button type="button" className={styles.quiet} onClick={() => setAskClear(true)}>
              Vider l’historique
            </button>
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
  if (session.roundsDone > 0) parts.push(`${session.roundsDone} round${session.roundsDone > 1 ? 's' : ''}`)
  if (session.laps.length > 0) parts.push(`${session.laps.length} tour${session.laps.length > 1 ? 's' : ''}`)
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
  if (sameDay(day, today)) return 'Aujourd’hui'
  if (sameDay(day, yesterday)) return 'Hier'
  return sessionDate(iso)
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  )
}
