import styles from './Switch.module.css'

type Props = { checked: boolean }

// presentational only, the row around it carries the role and the label
export default function Switch({ checked }: Props) {
  return <span className={`${styles.track} ${checked ? styles.on : ''}`} aria-hidden="true" />
}
