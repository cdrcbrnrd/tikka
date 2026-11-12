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

export default function SwipeRow({ actions, open, onOpenChange, children }: Props) {
  const content = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  // the gesture writes the transform straight to the node, a render per pointermove lands a frame late
  const gesture = useRef<{ x: number; y: number; offset: number; width: number } | null>(null)
  const axis = useRef<'none' | 'x' | 'y'>('none')
  const swallowClick = useRef(false)

  const slide = (offset: number, animated: boolean) => {
    const node = content.current
    if (!node) return
    node.classList.toggle(styles.sliding ?? '', animated)
    node.style.transform = `translate3d(${-offset}px, 0, 0)`
    panel.current?.classList.toggle(styles.revealed ?? '', offset > 0)
  }

  useLayoutEffect(() => {
    if (!gesture.current) slide(open ? (panel.current?.offsetWidth ?? 0) : 0, true)
  }, [open])

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    const width = panel.current?.offsetWidth ?? 0
    gesture.current = { x: event.clientX, y: event.clientY, offset: open ? width : 0, width }
    axis.current = 'none'
    swallowClick.current = false
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const from = gesture.current
    if (!from || axis.current === 'y') return
    const dx = event.clientX - from.x
    const dy = event.clientY - from.y

    if (axis.current === 'none') {
      if (Math.abs(dx) < DECIDE_PX && Math.abs(dy) < DECIDE_PX) return
      // a vertical move belongs to the list, only a sideways one opens the actions
      axis.current = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      if (axis.current === 'y') return
      event.currentTarget.setPointerCapture(event.pointerId)
    }

    slide(Math.min(from.width, Math.max(0, from.offset - dx)), false)
  }

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const from = gesture.current
    gesture.current = null
    if (!from || axis.current !== 'x') return
    axis.current = 'none'
    swallowClick.current = true

    const offset = Math.min(from.width, Math.max(0, from.offset - (event.clientX - from.x)))
    const next = offset >= (from.offset > 0 ? from.width - SNAP_PX : SNAP_PX)
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
      <div
        ref={content}
        className={`${styles.content} ${styles.sliding}`}
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
    </div>
  )
}
