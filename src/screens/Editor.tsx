import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import BackLink from '../components/BackLink.tsx'
import Button from '../components/Button.tsx'
import Stepper from '../components/Stepper.tsx'
import { clock } from '../domain/format.ts'
import { newId } from '../domain/id.ts'
import {
  blankTimer,
  defaultName,
  KIND_HINTS,
  KIND_LABELS,
  named,
  NAME_MAX,
  type Timer,
  type TimerKind,
} from '../domain/timer.ts'
import { useTimers } from '../store/timers.ts'
import styles from './Editor.module.css'

const KINDS: TimerKind[] = ['intervals', 'emom', 'countdown', 'stopwatch']
const DURATION_STEP = 15

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
  const upsert = useTimers((state) => state.upsert)
  const navigate = useNavigate()

  const patch = (changes: Partial<Timer>) => setDraft((current) => ({ ...current, ...changes }) as Timer)

  const changeKind = (kind: TimerKind) =>
    setDraft((current) => ({ ...blankTimer(kind, current.id), name: current.name, prepare: current.prepare }))

  const save = () => {
    upsert(named(draft))
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
            placeholder={defaultName(draft)}
            onChange={(event) => patch({ name: event.target.value })}
          />
        </div>

        <div className={styles.group}>
          <span className={styles.groupLabel}>Type</span>
          <div className={styles.kinds}>
            {KINDS.map((kind) => (
              <button
                key={kind}
                type="button"
                className={`${styles.kind} ${draft.kind === kind ? styles.kindOn : ''}`}
                aria-pressed={draft.kind === kind}
                onClick={() => changeKind(kind)}
              >
                <span className={styles.kindName}>{KIND_LABELS[kind]}</span>
                <span className="subtle one-line">{KIND_HINTS[kind]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.group}>
          <span className={styles.groupLabel}>Réglages</span>
          <div className={styles.fields}>
            <Duration
              label="Préparation"
              value={draft.prepare}
              min={0}
              max={120}
              onChange={(prepare) => patch({ prepare })}
            />

            {draft.kind === 'intervals' && (
              <>
                <Duration
                  label="Effort"
                  value={draft.work}
                  min={DURATION_STEP}
                  max={3600}
                  onChange={(work) => patch({ work })}
                />
                <Duration
                  label="Repos"
                  value={draft.rest}
                  min={0}
                  max={3600}
                  onChange={(rest) => patch({ rest })}
                />
                <Stepper
                  label="Séries"
                  value={draft.rounds}
                  min={1}
                  max={60}
                  onChange={(rounds) => patch({ rounds })}
                />
              </>
            )}

            {draft.kind === 'emom' && (
              <>
                <Duration
                  label="Période"
                  value={draft.period}
                  min={DURATION_STEP}
                  max={600}
                  onChange={(period) => patch({ period })}
                />
                <Stepper
                  label="Rounds"
                  value={draft.rounds}
                  min={1}
                  max={60}
                  onChange={(rounds) => patch({ rounds })}
                />
              </>
            )}

            {draft.kind === 'countdown' && (
              <Duration
                label="Durée"
                value={draft.duration}
                min={DURATION_STEP}
                max={7200}
                onChange={(duration) => patch({ duration })}
              />
            )}
          </div>
        </div>
      </div>

      <div className={`screen-footer ${styles.actions}`}>
        <Button variant="accent" block onClick={save}>
          Enregistrer
        </Button>
      </div>

    </div>
  )
}

type DurationProps = {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}

function Duration({ label, value, min, max, onChange }: DurationProps) {
  return (
    <Stepper
      label={label}
      value={value}
      min={min}
      max={max}
      onChange={onChange}
      format={clock}
      stepFor={durationStep}
    />
  )
}

// a saved duration may sit off the grid, the first press lands on it instead of past it
function durationStep(value: number, direction: 1 | -1): number {
  const offGrid = value % DURATION_STEP
  if (offGrid === 0) return DURATION_STEP
  return direction === 1 ? DURATION_STEP - offGrid : offGrid
}
