import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/Button.tsx'
import ConfirmDeleteTimer from '../components/ConfirmDeleteTimer.tsx'
import Icon from '../components/Icon.tsx'
import SwipeRow from '../components/SwipeRow.tsx'
import { copyOf, describe, totalShort, type Timer } from '../domain/timer.ts'
import { useTimers } from '../store/timers.ts'
import styles from './Home.module.css'

export default function Home() {
  const timers = useTimers((state) => state.timers)
  const upsert = useTimers((state) => state.upsert)
  const remove = useTimers((state) => state.remove)
  const navigate = useNavigate()
  const [swiped, setSwiped] = useState<string | null>(null)
  const [askDelete, setAskDelete] = useState<Timer | null>(null)

  const confirmDelete = () => {
    if (askDelete) remove(askDelete.id)
    setAskDelete(null)
  }

  return (
    <div className="screen">
      <header className="screen-head">
        <h1 className="title">Tikka</h1>
        <nav className={styles.headLinks}>
          <Link to="/historique" className={styles.headLink} aria-label="Historique">
            <Icon name="clock" size={28} />
          </Link>
          <Link to="/reglages" className={styles.headLink} aria-label="Réglages">
            <Icon name="settings" size={28} />
          </Link>
        </nav>
      </header>

      {timers.length === 0 ? (
        <div className="empty grow">
          <p>Aucun chrono pour l’instant.</p>
          <p className="subtle">Crée ton premier réglage.</p>
        </div>
      ) : (
        <ul className={`${styles.list} grow`}>
          {timers.map((timer) => (
            <li key={timer.id}>
              <SwipeRow
                open={swiped === timer.id}
                onOpenChange={(open) => setSwiped(open ? timer.id : null)}
                actions={[
                  {
                    icon: 'pencil',
                    label: `Modifier ${timer.name}`,
                    onClick: () => navigate(`/chrono/${timer.id}`),
                  },
                  {
                    icon: 'copy',
                    label: `Dupliquer ${timer.name}`,
                    onClick: () => upsert(copyOf(timer)),
                  },
                  {
                    icon: 'trash',
                    label: `Supprimer ${timer.name}`,
                    danger: true,
                    onClick: () => setAskDelete(timer),
                  },
                ]}
              >
                <Link to={`/lancer/${timer.id}`} className={styles.main} draggable={false}>
                  <span className={styles.line}>
                    <span className={`${styles.name} one-line`}>{timer.name}</span>
                    <Total timer={timer} />
                  </span>
                  <span className="subtle one-line">{describe(timer)}</span>
                </Link>
              </SwipeRow>
            </li>
          ))}
        </ul>
      )}

      <div className="screen-footer">
        <Button variant="accent" block onClick={() => navigate('/chrono/nouveau')}>
          <Icon name="plus" size={20} />
          Nouveau chrono
        </Button>
      </div>

      {askDelete && (
        <ConfirmDeleteTimer
          name={askDelete.name}
          onConfirm={confirmDelete}
          onCancel={() => setAskDelete(null)}
        />
      )}
    </div>
  )
}

function Total({ timer }: { timer: Timer }) {
  const total = totalShort(timer)
  if (!total) return null
  return <span className={`${styles.total} digits`}>{total}</span>
}
