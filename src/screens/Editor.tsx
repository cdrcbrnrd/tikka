import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import BackLink from '../components/BackLink.tsx'
import Button from '../components/Button.tsx'
import Select from '../components/Select.tsx'
import { newId } from '../domain/id.ts'
import {
  blankTimer,
  KIND_GROUPS,
  KIND_HINTS,
  KIND_LABELS,
  NAME_MAX,
  SETTINGS,
  takesPrepare,
  type Setting,
  type Timer,
  type TimerKind,
} from '../domain/timer.ts'
import { useTimers } from '../store/timers.ts'
import EditorFields from './EditorFields.tsx'
import styles from './Editor.module.css'

const GROUPS = KIND_GROUPS.map((group) => ({
  label: group.label,
  options: group.kinds.map((kind) => ({ value: kind, label: KIND_LABELS[kind], hint: KIND_HINTS[kind] })),
}))

export default function Editor() {
  const { id } = useParams()
  const timers = useTimers((state) => state.timers)
  const existing = id ? timers.find((timer) => timer.id === id) : undefined
  // a fresh id on every render would remount the form and wipe what is being typed
  const draftId = useMemo(() => newId(), [])

  if (id && !existing) return <Navigate to="/" replace />
  const initial = existing ?? blankTimer('intervals', draftId)
  return <Form key={initial.id} initial={initial} isNew={!existing} />
}

function Form({ initial, isNew }: { initial: Timer; isNew: boolean }) {
  const [draft, setDraft] = useState<Timer>(initial)
  const [suggested, setSuggested] = useState<Set<Setting>>(() => new Set(isNew ? SETTINGS : []))
  const upsert = useTimers((state) => state.upsert)
  const navigate = useNavigate()

  const patch = (changes: Partial<Timer>) => setDraft((current) => ({ ...current, ...changes }) as Timer)

  const setSetting = (key: Setting, value: number) => {
    setSuggested((current) => {
      const next = new Set(current)
      next.delete(key)
      return next
    })
    patch({ [key]: value } as Partial<Timer>)
  }

  const changeKind = (kind: TimerKind) => {
    if (kind === draft.kind) return
    setDraft((current) => {
      const fresh = blankTimer(kind, current.id)
      return {
        ...fresh,
        name: current.name,
        // a kind that hides the field keeps its own value, the athlete could never correct it
        prepare: takesPrepare(kind) ? current.prepare : fresh.prepare,
        warmup: current.warmup,
        cooldown: current.cooldown,
      }
    })
    if (!isNew) return
    // the preparation is the one setting carried over, so it keeps whatever the athlete did to it
    setSuggested((current) => {
      const next = new Set(SETTINGS)
      if (!current.has('prepare')) next.delete('prepare')
      return next
    })
  }

  const name = draft.name.trim()

  const save = () => {
    upsert({ ...draft, name })
    navigate('/')
  }

  return (
    <div className="screen">
      <header className={styles.group}>
        <BackLink to="/" label="Mes chronos" />
        <h1 className="title">{isNew ? 'Nouveau chrono' : draft.name}</h1>
      </header>

      <div className={`${styles.form} grow`}>
        <div className={styles.group}>
          <label className={styles.groupLabel} htmlFor="nom">
            Nom
          </label>
          <input
            id="nom"
            className={styles.name}
            type="text"
            value={draft.name}
            maxLength={NAME_MAX}
            placeholder="Nom du chrono"
            onChange={(event) => patch({ name: event.target.value })}
          />
        </div>

        <div className={styles.group}>
          <span className={styles.groupLabel} id="type-label">
            Type
          </span>
          <Select
            labelledBy="type-label"
            title="Type de chrono"
            value={draft.kind}
            groups={GROUPS}
            onChange={changeKind}
          />
          <span className={`subtle ${styles.hint}`}>{KIND_HINTS[draft.kind]}</span>
        </div>

        <div className={styles.group}>
          <span className={styles.groupLabel}>Réglages</span>
          <div className={styles.fields}>
            <EditorFields draft={draft} suggested={suggested} setSetting={setSetting} />
          </div>
        </div>
      </div>

      <div className={`screen-footer ${styles.actions}`}>
        <Button variant="accent" block disabled={name === ''} onClick={save}>
          Enregistrer
        </Button>
      </div>
    </div>
  )
}
