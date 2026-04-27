import { notFound } from 'next/navigation'
import ArticleEditorClient from '@/components/admin/ArticleEditorClient'
import { getCategorias } from '@/lib/supabase/queries'
import { getArticleById, listColumnists } from '@/lib/supabase/admin'

export const runtime = 'edge'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarArtigoPage({ params }: Props) {
  const { id } = await params
  const [article, categories, columnists] = await Promise.all([
    getArticleById(id),
    getCategorias(),
    listColumnists(),
  ])

  if (!article) notFound()

  const initial = {
    id: article.id,
    title: article.title ?? '',
    slug: article.slug ?? '',
    excerpt: article.excerpt ?? '',
    category_slug: article.category_slug ?? '',
    theme_slug: article.theme_slug ?? '',
    content_type: article.content_type ?? 'news',
    source_type: article.source_type ?? 'original',
    origin_badge: article.origin_badge ?? '',
    featured_image_url: article.featured_image_url ?? '',
    featured_image_alt: article.featured_image_alt ?? '',
    featured_image_caption: article.featured_image_caption ?? '',
    seo_title: article.seo_title ?? '',
    seo_description: article.seo_description ?? '',
    status: article.status as 'draft' | 'published' | 'archived',
    content: article.content ?? { rendered: '' },
    columnist_id: article.columnist_id ?? '',
    published_at: article.published_at ?? '',
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white shrink-0">
        <a href="/admin/artigos" className="text-sm text-gray-500 hover:text-[#f5821f]">← Artigos</a>
        <span className="text-gray-300">/</span>
        <h1 className="text-sm font-semibold text-gray-800 truncate max-w-sm">{article.title}</h1>
        <a
          href={`/${article.slug}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-xs text-[#f5821f] hover:underline shrink-0"
        >
          Ver no portal ↗
        </a>
      </div>
      <div className="flex-1 overflow-hidden">
        <ArticleEditorClient categories={categories} columnists={columnists as never} initial={initial} />
      </div>
    </div>
  )
}
