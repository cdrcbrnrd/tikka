import { ChevronDown, ChevronLeft, Clock, Copy, Pencil, Plus, Settings2, Trash2 } from 'lucide-react'

// lucide, the set shadcn draws with, kept behind one name so a screen never imports a glyph directly
const ICONS = {
  pencil: Pencil,
  plus: Plus,
  back: ChevronLeft,
  chevron: ChevronDown,
  clock: Clock,
  settings: Settings2,
  copy: Copy,
  trash: Trash2,
}

export type IconName = keyof typeof ICONS

type Props = { name: IconName; size?: number }

export default function Icon({ name, size = 20 }: Props) {
  const Glyph = ICONS[name]
  // lucide thickens the stroke along with the size, absolute keeps one line weight across the app
  return <Glyph size={size} absoluteStrokeWidth aria-hidden="true" />
}
