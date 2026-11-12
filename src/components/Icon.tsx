type Props = { name: 'pencil' | 'plus' | 'back' | 'clock'; size?: number }

const PATHS: Record<Props['name'], string> = {
  pencil: 'M4 20h4L19 9l-4-4L4 16v4Zm12.5-16.5 4 4',
  plus: 'M12 5v14M5 12h14',
  back: 'M15 19l-7-7 7-7',
  clock: 'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
}

export default function Icon({ name, size = 20 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
