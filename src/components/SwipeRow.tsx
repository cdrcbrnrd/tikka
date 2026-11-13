import { useLayoutEffect, useRef, type MouseEvent, type PointerEvent, type ReactNode } from 'react'
import Icon, { type IconName } from './Icon.tsx'
import styles from './SwipeRow.module.css'

const DECIDE_PX = 8
const SNAP_PX = 40

export type SwipeAction = {
  icon: IconName
  label: string
  danger?: boolean
  onClick: () => void
}

type Props = {
  actions: SwipeAction[]
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}

type Gesture = { x: number; y: number; offset: number; width: number; axis: 'none' | 'x' | 'y' }

export default function SwipeRow({ actions, open, onOpenChange, children }: Props) {
  const panel = useRef<HTMLDivElement>(null)
  const gesture = useRef<Gesture | null>(null)
  const offset = useRef(0)
  const swallowClick = useRef(false)

  const width = () => panel.current?.offsetWidth ?? 0

  // the gesture writes the transform straight to the node, a render per pointermove lands a frame late
  const slide = (to: number, animated: boolean) => {
    const node = panel.current
    if (!node || to === offset.current) return
    node.style.transition = animated ? '' : 'none'
    node.style.transform = `translate3d(${-to}px, 0, 0)`
    offset.current = to
  }

  useLayoutEffect(() => {
    if (open === offset.current > 0) return
    slide(open ? width() : 0, true)
  }, [open])

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    const panelWidth = width()
    gesture.current = {
      x: event.clientX,
      y: event.clientY,
      offset: open ? panelWidth : 0,
      width: panelWidth,
      axis: 'none',
    }
    swallowClick.current = false
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const from = gesture.current
    if (!from || from.axis === 'y') return
    const dx = event.clientX - from.x
    const dy = event.clientY - from.y

    if (from.axis === 'none') {
      if (Math.abs(dx) < DECIDE_PX && Math.abs(dy) < DECIDE_PX) return
      // a vertical move belongs to the list, only a sideways one opens the actions
      from.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      if (from.axis === 'y') return
      event.currentTarget.setPointerCapture(event.pointerId)
    }

    slide(clamp(from, dx), false)
  }

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const from = gesture.current
    gesture.current = null
    if (!from || from.axis !== 'x') return
    swallowClick.current = true

    const landed = clamp(from, event.clientX - from.x)
    const next = landed >= (from.offset > 0 ? from.width - SNAP_PX : SNAP_PX)
    slide(next ? from.width : 0, true)
    if (next !== open) onOpenChange(next)
  }

  // the click that ends a swipe would otherwise follow the link underneath
  const onClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (!swallowClick.current) return
    swallowClick.current = false
    event.preventDefault()
    event.stopPropagation()
  }

  return (
    <div className={styles.wrap}>
      <div
        className={styles.content}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={onClickCapture}
      >
        {children}
        {open && (
          <button
            type="button"
            className={styles.cover}
            aria-label="Fermer les actions"
            onClick={() => onOpenChange(false)}
          />
        )}
      </div>
      <div className={styles.actions} ref={panel} inert={!open}>
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            className={`${styles.action} ${action.danger ? styles.danger : ''}`}
            aria-label={action.label}
            onClick={() => {
              onOpenChange(false)
              action.onClick()
            }}
          >
            <Icon name={action.icon} size={32} />
          </button>
        ))}
      </div>
    </div>
  )
}

function clamp(gesture: Gesture, dx: number): number {
  return Math.min(gesture.width, Math.max(0, gesture.offset - dx))
}
