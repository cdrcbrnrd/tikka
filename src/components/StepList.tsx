import Button from './Button.tsx'
import Duration from './Duration.tsx'
import Icon from './Icon.tsx'
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

  const last = steps[steps.length - 1]

  return (
    <div className={styles.list}>
      {steps.map((step, index) => (
        <div key={step.id} className={styles.step}>
          <div className="line">
            <span className="group-label">{`${word.one} ${index + 1}`}</span>
            <button
              type="button"
              className={styles.remove}
              aria-label={`Retirer ${word.one} ${index + 1}`}
              disabled={steps.length <= 1}
              onClick={() => onChange(steps.filter((_, at) => at !== index))}
            >
              <Icon name="trash" />
            </button>
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
    </div>
  )
}
