import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import BackLink from '../components/BackLink.tsx'
import Button from '../components/Button.tsx'
import Total from '../components/Total.tsx'
import { newId } from '../domain/id.ts'
import {
  blankTimer,
  describe,
  isKind,
  KIND_HINTS,
  KIND_LABELS,
  NAME_MAX,
  type Timer,
} from '../domain/timer.ts'
import { useTimers } from '../store/timers.ts'
import EditorFields from './EditorFields.tsx'
import styles from './Editor.module.css'

export default function Editor() {
  const { id, kind } = useParams()
  const timers = useTimers((state) => state.timers)
  const existing = id ? timers.find((timer) => timer.id === id) : undefined
  // the draft keeps one id across renders, so the form saves the one it mounted with
  const draftId = useMemo(() => newId(), [])

  if (existing) return <Form key={existing.id} initial={existing} isNew={false} />
  if (id) return <Navigate to="/" replace />
  if (!isKind(kind)) return <Navigate to="/chrono/nouveau" replace />
  // two kinds share this route, and without a key the draft would keep the first one
  return <Form key={kind} initial={blankTimer(kind, draftId)} isNew />
}

function Form({ initial, isNew }: { initial: Timer; isNew: boolean }) {
  const [draft, setDraft] = useState<Timer>(initial)
  const upsert = useTimers((state) => state.upsert)
  const navigate = useNavigate()

  const patch = (changes: Partial<Timer>) => setDraft((current) => ({ ...current, ...changes }) as Timer)

  const name = draft.name.trim()
  const head = isNew
    ? { to: '/chrono/nouveau', label: 'Type', title: KIND_LABELS[draft.kind], hint: KIND_HINTS[draft.kind] }
    : { to: '/', label: 'Mes chronos', title: draft.name, hint: KIND_LABELS[draft.kind] }

  const save = () => {
    upsert({ ...draft, name })
    navigate('/')
  }

  return (
    <div className="screen">
      <header className="screen-intro">
        <BackLink to={head.to} label={head.label} />
        <h1 className="title">{head.title}</h1>
        <span className="subtle">{head.hint}</span>
      </header>

      <div className={`${styles.form} grow`}>
        <EditorFields draft={draft} patch={patch} />

        <div className={styles.group}>
          <label className="group-label" htmlFor="nom">
            Nom
          </label>
          <input
            id="nom"
            className="text-input"
            type="text"
            value={draft.name}
            maxLength={NAME_MAX}
            placeholder="Nom du chrono"
            onChange={(event) => patch({ name: event.target.value })}
          />
        </div>
      </div>

      <div className={`screen-footer ${styles.actions}`}>
        <div className={`${styles.recap} line`}>
          <span className="subtle one-line">{describe(draft)}</span>
          <Total timer={draft} />
        </div>
        <Button variant="accent" block disabled={name === ''} onClick={save}>
          Enregistrer
        </Button>
      </div>
    </div>
  )
}
