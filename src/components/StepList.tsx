import Button from './Button.tsx'
import Duration from './Duration.tsx'
import Icon from './Icon.tsx'
import IconButton from './IconButton.tsx'
import { newId } from '../domain/id.ts'
import { STEP_WORD } from '../domain/plan.ts'
import {
  MAX_DURATION,
  MIN_DURATION,
  NAME_MAX,
  STEP_DURATION,
  STEPS_MAX,
  type TimerStep,
} from '../domain/timer.ts'
import styles from './StepList.module.css'

type Props = {
  steps: TimerStep[]
  kind: keyof typeof STEP_WORD
  onChange: (steps: TimerStep[]) => void
}

export default function StepList({ steps, kind, onChange }: Props) {
  // a circuit names its exercises, a ladder only climbs
  const named = kind === 'circuit'
  const word = STEP_WORD[kind]

  const replace = (index: number, changes: Partial<TimerStep>) =>
    onChange(steps.map((step, at) => (at === index ? { ...step, ...changes } : step)))

  const move = (index: number, by: 1 | -1) => {
    const next = [...steps]
    const [moved] = next.splice(index, 1)
    if (moved) next.splice(index + by, 0, moved)
    onChange(next)
  }

  const last = steps[steps.length - 1]
  // a pyramid is a ladder that walks back down, and its peak is climbed once
  const mirrored = steps.length * 2 - 1

  return (
    <div className={styles.list}>
      {steps.map((step, index) => (
        <div key={step.id} className={styles.step}>
          <div className="line">
            <span className="group-label">{`${word.one} ${index + 1}`}</span>
            <span className={styles.rowActions}>
              <IconButton
                icon="up"
                label={`Monter ${word.one} ${index + 1}`}
                disabled={index === 0}
                onClick={() => move(index, -1)}
              />
              <IconButton
                icon="down"
                label={`Descendre ${word.one} ${index + 1}`}
                disabled={index === steps.length - 1}
                onClick={() => move(index, 1)}
              />
              <IconButton
                icon="trash"
                label={`Retirer ${word.one} ${index + 1}`}
                disabled={steps.length <= 1}
                onClick={() => onChange(steps.filter((_, at) => at !== index))}
              />
            </span>
          </div>

          {named && (
            <input
              className="text-input"
              type="text"
              value={step.label}
              maxLength={NAME_MAX}
              aria-label={`Nom de l’exercice ${index + 1}`}
              placeholder="Nom de l’exercice"
              onChange={(event) => replace(index, { label: event.target.value })}
            />
          )}

          <Duration
            label="Durée"
            value={step.duration}
            min={MIN_DURATION}
            max={MAX_DURATION}
            onChange={(duration) => replace(index, { duration })}
          />
        </div>
      ))}

      <Button
        block
        disabled={steps.length >= STEPS_MAX}
        onClick={() =>
          onChange([...steps, { id: newId(), label: '', duration: last?.duration ?? STEP_DURATION }])
        }
      >
        <Icon name="plus" />
        {`Ajouter ${word.add}`}
      </Button>

      {kind === 'ladder' && steps.length > 1 && (
        <Button
          block
          disabled={mirrored > STEPS_MAX}
          onClick={() =>
            onChange([
              ...steps,
              ...steps
                .slice(0, -1)
                .reverse()
                .map((step) => ({ ...step, id: newId() })),
            ])
          }
        >
          Ajouter la redescente
        </Button>
      )}
    </div>
  )
}
