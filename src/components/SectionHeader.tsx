import Link from 'next/link'

interface SectionHeaderProps {
  title: string
  href?: string
  color?: string
}

export default function SectionHeader({ title, href, color = '#f5821f' }: SectionHeaderProps) {
  return (
    <div
      className="flex items-center justify-between px-4 py-2.5 mb-5 rounded-sm"
      style={{ backgroundColor: color }}
    >
      <h2 className="text-white font-extrabold text-sm uppercase tracking-widest">
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="text-white/80 text-xs font-semibold hover:text-white transition-colors"
        >
          Ver mais ›
        </Link>
      )}
    </div>
  )
}
