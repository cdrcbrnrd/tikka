import Stepper from './Stepper.tsx'
import { clock, parseClock } from '../domain/format.ts'

type Props = {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  format?: (value: number) => string
}

// a duration can be typed, so its default reads as a value and not as a placeholder
export default function Duration({ label, value, min, max, onChange, format = clock }: Props) {
  return (
    <Stepper
      label={label}
      value={value}
      min={min}
      max={max}
      onChange={onChange}
      format={format}
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
