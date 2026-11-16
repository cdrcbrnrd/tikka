import Icon from './Icon.tsx'
import styles from './Select.module.css'

type Group<T extends string> = { label: string; options: { value: T; label: string }[] }

type Props<T extends string> = {
  id: string
  value: T
  groups: Group<T>[]
  onChange: (value: T) => void
}

export default function Select<T extends string>({ id, value, groups, onChange }: Props<T>) {
  return (
    <div className={styles.wrap}>
      <select
        id={id}
        className={styles.field}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {groups.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <span className={styles.chevron}>
        <Icon name="chevron" size={20} />
      </span>
    </div>
  )
}
