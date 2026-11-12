import type { ButtonHTMLAttributes } from 'react'
import styles from './Button.module.css'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'accent' | 'surface' | 'ghost'
  block?: boolean
}

export default function Button({ variant = 'surface', block, className, ...rest }: Props) {
  const classes = [styles.button, styles[variant], block ? styles.block : '', className ?? '']
  return <button type="button" className={classes.filter(Boolean).join(' ')} {...rest} />
}
