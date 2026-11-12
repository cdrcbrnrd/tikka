import BackLink from '../components/BackLink.tsx'
import { THEMES } from '../domain/theme.ts'
import { useSettings } from '../store/settings.ts'
import styles from './Settings.module.css'

export default function Settings() {
  const theme = useSettings((state) => state.theme)
  const setTheme = useSettings((state) => state.setTheme)

  return (
    <div className="screen">
      <header className="screen-head">
        <div>
          <BackLink to="/" label="Mes chronos" />
          <h1 className="title">Réglages</h1>
        </div>
      </header>

      <div className={`${styles.group} grow`}>
        <h2 className={styles.label}>Ambiance</h2>
        {THEMES.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={theme === item.id}
            className={`${styles.theme} ${theme === item.id ? styles.themeOn : ''}`}
            onClick={() => setTheme(item.id)}
          >
            <span className={styles.swatch}>
              {item.swatch.map((colour) => (
                <span key={colour} className={styles.chip} style={{ background: colour }} />
              ))}
            </span>
            <span className={`${styles.name} wordmark`}>{item.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
