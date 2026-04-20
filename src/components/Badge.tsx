interface BadgeProps {
  name: string
  color?: string | null
  size?: 'sm' | 'md'
}

export default function Badge({ name, color = '#f5821f', size = 'sm' }: BadgeProps) {
  // Cidades têm badge_color #8dc63f → texto verde; todo o resto → texto laranja
  const textColor = color === '#8dc63f' ? '#8dc63f' : '#f5821f'
  const fontSize = size === 'md' ? 'text-xs' : 'text-[11px]'

  return (
    <span
      className={`inline-block font-bold uppercase tracking-wide ${fontSize}`}
      style={{ color: textColor }}
    >
      {name}
    </span>
  )
}
