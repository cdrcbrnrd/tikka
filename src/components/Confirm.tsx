import { useEffect } from 'react'
import Button from './Button.tsx'
import styles from './Confirm.module.css'

type Props = {
  title: string
  detail?: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}

export default function Confirm({ title, detail, confirmLabel, onConfirm, onCancel }: Props) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-label={title}>
      <div className={styles.sheet}>
        <div className={styles.text}>
          <strong>{title}</strong>
          {detail && <span className="subtle">{detail}</span>}
        </div>
        <div className={styles.actions}>
          <Button onClick={onCancel}>Annuler</Button>
          <Button variant="accent" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
