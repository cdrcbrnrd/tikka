import Icon, { type IconName } from './Icon.tsx'
import styles from './IconButton.module.css'

type Props = {
  icon: IconName
  label: string
  // a ring tells a lone button where its edge is, a row of them reads fine without
  ringed?: boolean
  disabled?: boolean
  onClick: () => void
}

export default function IconButton({ icon, label, ringed = false, disabled = false, onClick }: Props) {
  return (
    <button
      type="button"
      className={`${styles.button} ${ringed ? styles.ringed : ''}`}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon name={icon} />
    </button>
  )
}
