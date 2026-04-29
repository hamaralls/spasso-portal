import Link from 'next/link'

interface SectionHeaderProps {
  title: string
  href?: string
  color?: string
  titleColor?: string
  linkColor?: string
}

export default function SectionHeader({ title, href, color = '#f5821f', titleColor, linkColor }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between pb-2 mb-5 border-b border-gray-200">
      <h2
        className={`font-extrabold text-sm uppercase tracking-widest pl-3 ${titleColor ? '' : 'text-[#1a1a1a]'}`}
        style={{ borderLeft: `4px solid ${color}`, color: titleColor }}
      >
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className={`text-xs font-semibold hover:text-[#f5821f] transition-colors ${linkColor ? '' : 'text-gray-400'}`}
          style={{ color: linkColor }}
        >
          Ver mais ›
        </Link>
      )}
    </div>
  )
}
