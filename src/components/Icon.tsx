import {
  AlarmClock,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coffee,
  Copy,
  FlagTriangleRight,
  Hourglass,
  Infinity as Loop,
  ListOrdered,
  Pencil,
  Plus,
  Repeat,
  Settings2,
  Timer,
  TimerReset,
  Trash2,
  TrendingUp,
  Zap,
} from 'lucide-react'

// lucide, the set shadcn draws with, kept behind one name so a screen never imports a glyph directly
const ICONS = {
  pencil: Pencil,
  plus: Plus,
  back: ChevronLeft,
  go: ChevronRight,
  clock: Clock,
  settings: Settings2,
  copy: Copy,
  trash: Trash2,
  timer: Timer,
  hourglass: Hourglass,
  coffee: Coffee,
  repeat: Repeat,
  bolt: Zap,
  alarm: AlarmClock,
  reset: TimerReset,
  flag: FlagTriangleRight,
  loop: Loop,
  list: ListOrdered,
  climb: TrendingUp,
}

export type IconName = keyof typeof ICONS

type Props = { name: IconName; size?: number }

export default function Icon({ name, size = 20 }: Props) {
  const Glyph = ICONS[name]
  // lucide thickens the stroke along with the size, absolute keeps one line weight across the app
  return <Glyph size={size} absoluteStrokeWidth aria-hidden="true" />
}
