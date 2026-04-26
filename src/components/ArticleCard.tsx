import Link from 'next/link'
import Image from 'next/image'
import Badge from './Badge'
import { timeAgo } from '@/lib/format'
import type { ArticlePublico } from '@/types'

interface ArticleCardProps {
  article: ArticlePublico
  size?: 'default' | 'featured' | 'compact' | 'default-lg' | 'columnist'
}

export default function ArticleCard({ article, size = 'default' }: ArticleCardProps) {
  const { slug, title, excerpt, featured_image_url, category_name, badge_color, published_at, author_name, author_avatar, origin_badge, columnist_type } = article

  if (size === 'columnist') {
    const displayName = author_name ?? origin_badge ?? null
    const initials = displayName
      ? displayName.split(' ').filter(Boolean).map((n: string) => n[0].toUpperCase()).slice(0, 2).join('')
      : '?'
    const isEditorial = !columnist_type || columnist_type === 'editorial'

    return (
      <Link href={`/${slug}`} className="group flex items-start gap-3 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
          style={{ background: isEditorial || !author_avatar ? '#f5821f1a' : undefined }}
        >
          {!isEditorial && author_avatar ? (
            <Image src={author_avatar} alt={displayName ?? ''} width={44} height={44} className="object-cover w-full h-full" />
          ) : (
            <span className="text-sm font-bold text-[#f5821f]">{initials}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          {displayName && (
            <p className="text-xs font-bold text-[#f5821f] uppercase tracking-wide truncate mb-0.5">{displayName}</p>
          )}
          <h3 className="text-sm font-semibold text-[#1a1a1a] leading-snug group-hover:text-[#f5821f] transition-colors line-clamp-2">
            {title}
          </h3>
          <div className="mt-1 text-xs text-gray-400">{timeAgo(published_at)}</div>
        </div>
      </Link>
    )
  }

  if (size === 'featured') {
    return (
      <Link href={`/${slug}`} className="group block bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="relative aspect-video w-full overflow-hidden bg-gray-200">
          {featured_image_url ? (
            <Image
              src={featured_image_url}
              alt={title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#f5821f]/20 to-[#f5821f]/5" />
          )}
        </div>
        <div className="p-3">
          {category_name && <Badge name={category_name} color={badge_color} size="sm" />}
          <h3 className="font-bold text-[#1a1a1a] leading-snug group-hover:text-[#f5821f] transition-colors line-clamp-3 mt-1.5">
            {title}
          </h3>
          {excerpt && (
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">
              {excerpt.replace(/<[^>]+>/g, '')}
            </p>
          )}
        </div>
      </Link>
    )
  }

  // default-lg — horizontal grande: imagem esq ~40%, texto dir, sem card box (Metrópoles)
  if (size === 'default-lg') {
    return (
      <Link href={`/${slug}`} className="group flex gap-4 items-start">
        <div className="relative w-[130px] h-[110px] shrink-0 overflow-hidden bg-gray-200">
          {featured_image_url ? (
            <Image src={featured_image_url} alt={title} fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="130px" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200" />
          )}
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          {category_name && <Badge name={category_name} color={badge_color} size="sm" />}
          <h3 className="text-base font-bold text-[#1a1a1a] leading-snug mt-1 group-hover:text-[#f5821f] transition-colors line-clamp-3">
            {title}
          </h3>
          {excerpt && (
            <p className="mt-1 text-xs text-gray-500 line-clamp-2 leading-relaxed">
              {excerpt.replace(/<[^>]+>/g, '')}
            </p>
          )}
        </div>
      </Link>
    )
  }

  if (size === 'compact') {
    return (
      <Link href={`/${slug}`} className="group flex gap-2 items-start">
        <div className="relative w-[80px] h-[72px] flex-shrink-0 overflow-hidden bg-gray-200">
          {featured_image_url && (
            <Image src={featured_image_url} alt={title} fill className="object-cover" sizes="80px" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          {category_name && <Badge name={category_name} color={badge_color} size="sm" />}
          <h3 className="text-xs font-bold text-[#1a1a1a] leading-snug mt-0.5 group-hover:text-[#f5821f] transition-colors line-clamp-3">
            {title}
          </h3>
        </div>
      </Link>
    )
  }

  // default — horizontal: imagem esq (10:9), badge acima do título
  return (
    <Link href={`/${slug}`}
      className="group flex gap-3 items-start bg-white p-2 shadow-sm hover:shadow-md transition-shadow">
      <div className="relative w-[100px] h-[90px] shrink-0 overflow-hidden bg-gray-200">
        {featured_image_url ? (
          <Image
            src={featured_image_url}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="96px"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200" />
        )}
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        {category_name && <Badge name={category_name} color={badge_color} size="sm" />}
        <h3 className="text-sm font-bold text-[#1a1a1a] leading-snug mt-1 group-hover:text-[#f5821f] transition-colors line-clamp-3">
          {title}
        </h3>
      </div>
    </Link>
  )
}
