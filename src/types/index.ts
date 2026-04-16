// ============================================================
// Tipos base — Portal Spasso Cidades
// ============================================================

export type CategoryType = 'cidade' | 'tema' | 'opiniao' | 'fixa'
export type ArticleStatus = 'draft' | 'published' | 'scheduled' | 'archived'
export type ContentType = 'news' | 'opinion' | 'special' | 'advertising' | 'press_release' | 'aggregated'
export type SourceType = 'original' | 'collaborator' | 'press_release' | 'aggregated'
export type UserRole = 'editor' | 'redator' | 'diretor'

export interface Category {
  id: string
  slug: string
  name: string
  type: CategoryType
  parent_slug: string | null
  url_prefix: string
  badge_color: string | null
  sort_order: number
}

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar_url: string | null
  bio: string | null
  active: boolean
}

export interface Article {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: { rendered: string; tiptap?: object }
  featured_image_url: string | null
  status: ArticleStatus
  category_slug: string | null
  content_type: ContentType
  source_type: SourceType
  origin_badge: string | null
  is_legacy_blog: boolean
  author_id: string | null
  seo_title: string | null
  seo_description: string | null
  seo_keywords: string[] | null
  published_at: string | null
  created_at: string
  updated_at: string
  wp_post_id: number | null
  views: number
  reading_time_min: number | null
}

// View artigos_publicados (join com category + user)
export interface ArticlePublico {
  id: string
  slug: string
  title: string
  excerpt: string | null
  featured_image_url: string | null
  content_type: ContentType
  source_type: SourceType
  origin_badge: string | null
  category_slug: string | null
  published_at: string
  views: number
  reading_time_min: number | null
  seo_title: string | null
  seo_description: string | null
  category_name: string | null
  badge_color: string | null
  url_prefix: string | null
  author_name: string | null
  author_avatar: string | null
}

export interface Redirect {
  id: string
  source: string
  destination: string
  status_code: number
  active: boolean
}

// Paginação
export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}
