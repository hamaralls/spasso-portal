import Link from 'next/link'

interface SectionHeaderProps {
  title: string
  href?: string
}

export default function SectionHeader({ title, href }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-1 h-6 bg-[#dd8500] rounded-full" />
        <h2 className="text-xl font-bold text-[#1a1a1a] uppercase tracking-wide">
          {title}
        </h2>
      </div>
      {href && (
        <Link
          href={href}
          className="text-sm font-medium text-[#dd8500] hover:underline"
        >
          Ver mais →
        </Link>
      )}
    </div>
  )
}
