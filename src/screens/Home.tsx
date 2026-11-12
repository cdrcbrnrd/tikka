import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/Button.tsx'
import ConfirmDeleteTimer from '../components/ConfirmDeleteTimer.tsx'
import Icon from '../components/Icon.tsx'
import SwipeRow from '../components/SwipeRow.tsx'
import Switch from '../components/Switch.tsx'
import { copyOf, describe, type Timer } from '../domain/timer.ts'
import { useSettings } from '../store/settings.ts'
import { useTimers } from '../store/timers.ts'
import styles from './Home.module.css'

export default function Home() {
  const timers = useTimers((state) => state.timers)
  const upsert = useTimers((state) => state.upsert)
  const remove = useTimers((state) => state.remove)
  const navigate = useNavigate()
  const [swiped, setSwiped] = useState<string | null>(null)
  const [askDelete, setAskDelete] = useState<Timer | null>(null)
  const ringInSilentMode = useSettings((state) => state.ringInSilentMode)
  const setRingInSilentMode = useSettings((state) => state.setRingInSilentMode)

  const confirmDelete = () => {
    if (askDelete) remove(askDelete.id)
    setAskDelete(null)
  }

  return (
    <div className="screen">
      <header className="screen-head">
        <h1 className="title">Tikka</h1>
        <Link to="/historique" className={styles.headLink}>
          <Icon name="clock" size={18} />
          Historique
        </Link>
      </header>

      {timers.length === 0 ? (
        <div className="empty grow">
          <p>Aucun chrono pour l’instant.</p>
          <p className="subtle">Crée ton premier réglage, il restera sur le téléphone.</p>
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
                  <span className={styles.name}>{timer.name}</span>
                  <span className="subtle">{describe(timer)}</span>
                </Link>
              </SwipeRow>
            </li>
          ))}
        </ul>
      )}

      <div className="screen-footer">
        <button
          type="button"
          role="switch"
          aria-checked={ringInSilentMode}
          className={styles.option}
          onClick={() => setRingInSilentMode(!ringInSilentMode)}
        >
          Bip même en silencieux
          <Switch checked={ringInSilentMode} />
        </button>

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
