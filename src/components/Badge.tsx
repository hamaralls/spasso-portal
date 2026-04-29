interface BadgeProps {
  name: string
  color?: string | null
  size?: 'sm' | 'md'
}

export default function Badge({ name, color = '#f5821f', size = 'sm' }: BadgeProps) {
  const textColor = color || '#f5821f'
  const fontSize = size === 'md' ? 'text-xs' : 'text-[10px]'

  return (
    <span
      className={`inline-block font-bold uppercase tracking-wide truncate ${fontSize}`}
      style={{ color: textColor }}
    >
      {name}
    </span>
  )
}
