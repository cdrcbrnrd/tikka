import Stepper from '../components/Stepper.tsx'
import { clock, parseClock } from '../domain/format.ts'
import { isOpenEnded, takesPrepare, type Setting, type Timer } from '../domain/timer.ts'

const MIN_DURATION = 5
const MAX_SIDE = 1800

type Props = {
  draft: Timer
  setSetting: (key: Setting, value: number) => void
}

export default function EditorFields({ draft, setSetting }: Props) {
  const field = (key: Setting) => ({ onChange: (value: number) => setSetting(key, value) })

  return (
    <>
      {takesPrepare(draft.kind) && (
        <Duration label="Préparation" value={draft.prepare} min={0} max={120} {...field('prepare')} />
      )}

      <Duration label="Échauffement" value={draft.warmup} min={0} max={MAX_SIDE} {...field('warmup')} />

      {draft.kind === 'intervals' && (
        <>
          <Duration label="Effort" value={draft.work} min={MIN_DURATION} max={3600} {...field('work')} />
          <Duration label="Repos" value={draft.rest} min={0} max={3600} {...field('rest')} />
          <Stepper label="Séries" value={draft.rounds} min={1} max={60} {...field('rounds')} />
        </>
      )}

      {draft.kind === 'tabata' && (
        <Stepper label="Cycles" value={draft.rounds} min={1} max={60} {...field('rounds')} />
      )}

      {(draft.kind === 'emom' || draft.kind === 'exmom') && (
        <>
          <Duration label="Période" value={draft.period} min={MIN_DURATION} max={600} {...field('period')} />
          <Stepper label="Rounds" value={draft.rounds} min={1} max={60} {...field('rounds')} />
        </>
      )}

      {(draft.kind === 'countdown' || draft.kind === 'rest') && (
        <Duration label="Durée" value={draft.duration} min={MIN_DURATION} max={7200} {...field('duration')} />
      )}

      {/* nothing can follow a segment the athlete closes by hand, the field would set a dead value */}
      {!isOpenEnded(draft) && (
        <Duration
          label="Retour au calme"
          value={draft.cooldown}
          min={0}
          max={MAX_SIDE}
          {...field('cooldown')}
        />
      )}
    </>
  )
}

type DurationProps = {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}

// a duration can be typed, so its default reads as a value and not as a placeholder
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
      parse={parseClock}
    />
  )
}

// a flat step would put a 20 min countdown a hundred presses away, or make 20 s unreachable
function stepAt(seconds: number): number {
  if (seconds < 60) return 5
  if (seconds < 300) return 15
  return 60
}

// a saved duration may sit off the grid, the first press lands on it instead of past it
function durationStep(value: number, direction: 1 | -1): number {
  const step = direction === 1 ? stepAt(value) : stepAt(value - 1)
  const offGrid = value % step
  if (offGrid === 0) return step
  return direction === 1 ? step - offGrid : offGrid
}
