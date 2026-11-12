import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/Button.tsx'
import Icon from '../components/Icon.tsx'
import { describe } from '../domain/timer.ts'
import { useTimers } from '../store/timers.ts'
import styles from './Home.module.css'

export default function Home() {
  const timers = useTimers((state) => state.timers)
  const navigate = useNavigate()

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
            <li key={timer.id} className={styles.row}>
              <Link to={`/lancer/${timer.id}`} className={styles.main}>
                <span className={styles.name}>{timer.name}</span>
                <span className="subtle">{describe(timer)}</span>
              </Link>
              <button
                type="button"
                className={styles.edit}
                aria-label={`Régler ${timer.name}`}
                onClick={() => navigate(`/chrono/${timer.id}`)}
              >
                <Icon name="pencil" size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.footer}>
        <Button variant="accent" block onClick={() => navigate('/chrono/nouveau')}>
          <Icon name="plus" size={20} />
          Nouveau chrono
        </Button>
      </div>
    </div>
  )
}
