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
  const { slug, title, excerpt, featured_image_url, category_name, badge_color, published_at } = article

  if (size === 'featured') {
    return (
      <Link href={`/${slug}`} className="group block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
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
          {category_name && (
            <div className="absolute bottom-2 left-2">
              <Badge name={category_name} color={badge_color} />
            </div>
          )}
        </div>
        <div className="p-3">
          <h3 className="font-bold text-[#1a1a1a] leading-snug group-hover:text-[#f5821f] transition-colors line-clamp-3">
            {title}
          </h3>
          {excerpt && (
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">
              {excerpt.replace(/<[^>]+>/g, '')}
            </p>
          )}
          <div className="mt-1.5 text-xs text-gray-400">
            {timeAgo(published_at)}
          </div>
        </div>
      </Link>
    )
  }

  if (size === 'compact') {
    return (
      <Link href={`/${slug}`} className="group flex gap-3 items-start bg-white rounded-lg p-2 shadow-sm hover:shadow-md transition-shadow">
        <div className="relative w-20 h-14 flex-shrink-0 overflow-hidden rounded bg-gray-200">
          {featured_image_url && (
            <Image
              src={featured_image_url}
              alt={title}
              fill
              className="object-cover"
              sizes="80px"
            />
          )}
          {category_name && (
            <div className="absolute bottom-1 left-1">
              <Badge name={category_name} color={badge_color} />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-[#1a1a1a] leading-snug group-hover:text-[#f5821f] transition-colors line-clamp-2">
            {title}
          </h3>
          <span className="text-xs text-gray-400">{timeAgo(published_at)}</span>
        </div>
      </Link>
    )
  }

  // default card
  return (
    <Link href={`/${slug}`} className="group block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="relative aspect-video w-full overflow-hidden bg-gray-200">
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
        {category_name && (
          <div className="absolute bottom-2 left-2">
            <Badge name={category_name} color={badge_color} />
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-bold text-[#1a1a1a] leading-snug group-hover:text-[#f5821f] transition-colors line-clamp-2">
          {title}
        </h3>
        <div className="mt-1.5 text-xs text-gray-400">
          {timeAgo(published_at)}
        </div>
      </div>
    </Link>
  )
}
