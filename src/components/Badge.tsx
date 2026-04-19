interface BadgeProps {
  name: string
  color?: string | null
  size?: 'sm' | 'md'
}

export default function Badge({ name, color = '#f5821f', size = 'sm' }: BadgeProps) {
  const bg = color ?? '#f5821f'
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'

  return (
    <span
      className={`inline-block font-bold uppercase tracking-wide rounded-sm text-white ${padding}`}
      style={{ backgroundColor: bg }}
    >
      {name}
    </span>
  )
}
