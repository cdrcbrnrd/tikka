import Icon from './Icon.tsx'
import styles from './Toggle.module.css'

type Props = {
  label: string
  value: boolean
  onChange: (value: boolean) => void
}

export default function Toggle({ label, value, onChange }: Props) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={value}
      className={`field ${styles.option}`}
      onClick={() => onChange(!value)}
    >
      <span className="subtle">{label}</span>
      <span className={`${styles.box} ${value ? styles.on : ''}`}>
        {value && <Icon name="check" size={18} />}
      </span>
    </button>
  )
}
