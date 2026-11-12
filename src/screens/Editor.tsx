import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import BackLink from '../components/BackLink.tsx'
import Button from '../components/Button.tsx'
import Stepper from '../components/Stepper.tsx'
import { clock } from '../domain/format.ts'
import { newId } from '../domain/id.ts'
import { hasDial } from '../domain/theme.ts'
import { blankTimer, defaultName, KIND_HINTS, KIND_LABELS, type Timer, type TimerKind } from '../domain/timer.ts'
import { useSettings } from '../store/settings.ts'
import { useTimers } from '../store/timers.ts'
import styles from './Editor.module.css'

const KINDS: TimerKind[] = ['intervals', 'emom', 'countdown', 'stopwatch']

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
  const dial = hasDial(useSettings((state) => state.theme))

  const patch = (changes: Partial<Timer>) => setDraft((current) => ({ ...current, ...changes }) as Timer)

  const changeKind = (kind: TimerKind) =>
    setDraft((current) => ({ ...blankTimer(kind, current.id), name: current.name, prepare: current.prepare }))

  const named = (timer: Timer) => {
    const name = timer.name.trim()
    return { ...timer, name: name === '' ? defaultName(timer) : name }
  }

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
            className={`${styles.name} wordmark`}
            type="text"
            value={draft.name}
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
                <span className={`${styles.kindName} wordmark`}>{KIND_LABELS[kind]}</span>
                <span className="subtle">{KIND_HINTS[kind]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.group}>
          <span className={styles.groupLabel}>Réglages</span>
          <div className={styles.fields}>
            <Duration
              label={dial ? 'Prépa' : 'Préparation'}
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
                  min={5}
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
                  min={10}
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
                min={10}
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

function durationStep(value: number): number {
  if (value < 60) return 5
  if (value < 300) return 15
  return 60
}
