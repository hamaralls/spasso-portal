'use client'

import dynamic from 'next/dynamic'
import type { Category } from '@/types'

const ArticleEditor = dynamic(
  () => import('./ArticleEditor'),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        Carregando editor...
      </div>
    ),
  }
)

interface ArticleData {
  id?: string
  title: string
  slug: string
  excerpt: string
  category_slug: string
  content_type: string
  source_type: string
  origin_badge: string
  featured_image_url: string
  seo_title: string
  seo_description: string
  status: 'draft' | 'published' | 'archived'
  content: { rendered: string }
}

interface Props {
  categories: Category[]
  initial?: Partial<ArticleData>
}

export default function ArticleEditorClient(props: Props) {
  return <ArticleEditor {...props} />
}
