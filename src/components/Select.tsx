import { useEffect, useState } from 'react'
import Icon from './Icon.tsx'
import styles from './Select.module.css'

type Option<T extends string> = { value: T; label: string; hint?: string }
type Group<T extends string> = { label: string; options: Option<T>[] }

type Props<T extends string> = {
  labelledBy: string
  title: string
  value: T
  groups: Group<T>[]
  onChange: (value: T) => void
}

export default function Select<T extends string>({ labelledBy, title, value, groups, onChange }: Props<T>) {
  const [open, setOpen] = useState(false)
  const current = groups.flatMap((group) => group.options).find((option) => option.value === value)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const pick = (next: T) => {
    setOpen(false)
    onChange(next)
  }

  return (
    <>
      <button
        type="button"
        className={styles.field}
        aria-labelledby={labelledBy}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <span>{current?.label ?? ''}</span>
        <Icon name="chevron" size={20} />
      </button>

      {open && (
        <div
          className={styles.backdrop}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={() => setOpen(false)}
        >
          {/* the sheet swallows the click so only the backdrop closes */}
          <div className={styles.sheet} onClick={(event) => event.stopPropagation()}>
            <strong className={styles.title}>{title}</strong>
            <div className={styles.list}>
              {groups.map((group) => (
                <div key={group.label} className={styles.group}>
                  <span className={styles.groupLabel}>{group.label}</span>
                  {group.options.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={styles.option}
                      aria-pressed={option.value === value}
                      onClick={() => pick(option.value)}
                    >
                      <span className={styles.optionText}>
                        <span className={styles.optionName}>{option.label}</span>
                        {option.hint && <span className="subtle one-line">{option.hint}</span>}
                      </span>
                      {option.value === value && <Icon name="check" size={20} />}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
