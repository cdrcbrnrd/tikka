import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import BackLink from '../components/BackLink.tsx'
import Button from '../components/Button.tsx'
import Stepper from '../components/Stepper.tsx'
import { clock } from '../domain/format.ts'
import { newId } from '../domain/id.ts'
import {
  blankTimer,
  KIND_HINTS,
  KIND_LABELS,
  NAME_MAX,
  type Timer,
  type TimerKind,
} from '../domain/timer.ts'
import { useTimers } from '../store/timers.ts'
import styles from './Editor.module.css'

const KINDS: TimerKind[] = ['intervals', 'emom', 'countdown', 'stopwatch']
const DURATION_STEP = 15
const SETTINGS = ['prepare', 'work', 'rest', 'rounds', 'period', 'duration'] as const
type Setting = (typeof SETTINGS)[number]

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
    // the kind buttons stay pressable once active, and rebuilding would throw away what was set
    if (kind === draft.kind) return
    setDraft((current) => ({ ...blankTimer(kind, current.id), name: current.name, prepare: current.prepare }))
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
              onChange={(prepare) => setSetting('prepare', prepare)}
              suggested={suggested.has('prepare')}
            />

            {draft.kind === 'intervals' && (
              <>
                <Duration
                  label="Effort"
                  value={draft.work}
                  min={DURATION_STEP}
                  max={3600}
                  onChange={(work) => setSetting('work', work)}
                  suggested={suggested.has('work')}
                />
                <Duration
                  label="Repos"
                  value={draft.rest}
                  min={0}
                  max={3600}
                  onChange={(rest) => setSetting('rest', rest)}
                  suggested={suggested.has('rest')}
                />
                <Stepper
                  label="Séries"
                  value={draft.rounds}
                  min={1}
                  max={60}
                  onChange={(rounds) => setSetting('rounds', rounds)}
                  suggested={suggested.has('rounds')}
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
                  onChange={(period) => setSetting('period', period)}
                  suggested={suggested.has('period')}
                />
                <Stepper
                  label="Rounds"
                  value={draft.rounds}
                  min={1}
                  max={60}
                  onChange={(rounds) => setSetting('rounds', rounds)}
                  suggested={suggested.has('rounds')}
                />
              </>
            )}

            {draft.kind === 'countdown' && (
              <Duration
                label="Durée"
                value={draft.duration}
                min={DURATION_STEP}
                max={7200}
                onChange={(duration) => setSetting('duration', duration)}
                suggested={suggested.has('duration')}
              />
            )}
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

type DurationProps = {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  suggested: boolean
}

function Duration({ label, value, min, max, onChange, suggested }: DurationProps) {
  return (
    <Stepper
      label={label}
      value={value}
      min={min}
      max={max}
      onChange={onChange}
      format={clock}
      stepFor={durationStep}
      suggested={suggested}
    />
  )
}

// a saved duration may sit off the grid, the first press lands on it instead of past it
function durationStep(value: number, direction: 1 | -1): number {
  const offGrid = value % DURATION_STEP
  if (offGrid === 0) return DURATION_STEP
  return direction === 1 ? DURATION_STEP - offGrid : offGrid
}
