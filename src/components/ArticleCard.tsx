import Link from 'next/link'
import Image from 'next/image'
import Badge from './Badge'
import { timeAgo } from '@/lib/format'
import type { ArticlePublico } from '@/types'

interface ArticleCardProps {
  article: ArticlePublico
  size?: 'default' | 'featured' | 'compact'
}

export default function ArticleCard({ article, size = 'default' }: ArticleCardProps) {
  const { slug, title, excerpt, featured_image_url, category_name, badge_color, published_at, reading_time_min } = article

  if (size === 'featured') {
    return (
      <Link href={`/${slug}/`} className="group block">
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-200">
          {featured_image_url ? (
            <Image
              src={featured_image_url}
              alt={title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#dd8500]/20 to-[#dd8500]/5" />
          )}
        </div>
        <div className="mt-3">
          {category_name && (
            <div className="mb-2">
              <Badge name={category_name} color={badge_color} />
            </div>
          )}
          <h3 className="text-lg font-bold text-[#1a1a1a] leading-snug group-hover:text-[#dd8500] transition-colors line-clamp-3">
            {title}
          </h3>
          {excerpt && (
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">
              {excerpt.replace(/<[^>]+>/g, '')}
            </p>
          )}
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
            <span>{timeAgo(published_at)}</span>
            {reading_time_min && <span>· {reading_time_min} min</span>}
          </div>
        </div>
      </Link>
    )
  }

  if (size === 'compact') {
    return (
      <Link href={`/${slug}/`} className="group flex gap-3 items-start">
        <div className="relative w-20 h-16 flex-shrink-0 overflow-hidden rounded bg-gray-200">
          {featured_image_url && (
            <Image
              src={featured_image_url}
              alt={title}
              fill
              className="object-cover"
              sizes="80px"
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          {category_name && (
            <div className="mb-1">
              <Badge name={category_name} color={badge_color} />
            </div>
          )}
          <h3 className="text-sm font-bold text-[#1a1a1a] leading-snug group-hover:text-[#dd8500] transition-colors line-clamp-2">
            {title}
          </h3>
          <span className="text-xs text-gray-400">{timeAgo(published_at)}</span>
        </div>
      </Link>
    )
  }

  // default card
  return (
    <Link href={`/${slug}/`} className="group block">
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-200">
        {featured_image_url ? (
          <Image
            src={featured_image_url}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200" />
        )}
      </div>
      <div className="mt-3">
        {category_name && (
          <div className="mb-2">
            <Badge name={category_name} color={badge_color} />
          </div>
        )}
        <h3 className="font-bold text-[#1a1a1a] leading-snug group-hover:text-[#dd8500] transition-colors line-clamp-2">
          {title}
        </h3>
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
          <span>{timeAgo(published_at)}</span>
          {reading_time_min && <span>· {reading_time_min} min de leitura</span>}
        </div>
      </div>
    </Link>
  )
}
