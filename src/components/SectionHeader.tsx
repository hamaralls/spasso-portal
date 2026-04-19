import Link from 'next/link'

interface SectionHeaderProps {
  title: string
  href?: string
  color?: string
}

export default function SectionHeader({ title, href, color = '#f5821f' }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between pb-2 mb-5 border-b border-gray-200">
      <h2
        className="font-extrabold text-sm uppercase tracking-widest text-[#1a1a1a] pl-3"
        style={{ borderLeft: `4px solid ${color}` }}
      >
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="text-xs font-semibold text-gray-400 hover:text-[#f5821f] transition-colors"
        >
          Ver mais ›
        </Link>
      )}
    </div>
  )
}
