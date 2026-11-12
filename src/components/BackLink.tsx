import { Link } from 'react-router-dom'
import Icon from './Icon.tsx'
import styles from './BackLink.module.css'

type Props = { to: string; label?: string }

export default function BackLink({ to, label = 'Retour' }: Props) {
  return (
    <Link to={to} className={styles.link} aria-label={label}>
      <Icon name="back" size={20} />
      <span>{label}</span>
    </Link>
  )
}
