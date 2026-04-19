import type { MetadataRoute } from 'next'
import { getAllArtigosSlugs, getCategorias } from '@/lib/supabase/queries'

export const runtime = 'edge'

const BASE = 'https://jornalspassocidades.com.br'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [slugs, categorias] = await Promise.all([
    getAllArtigosSlugs(),
    getCategorias(),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: 'hourly', priority: 1 },
    { url: `${BASE}/sobre/`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/contato/`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/anuncie/`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/edicao-impressa/`, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${BASE}/privacidade/`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE}/termos-de-uso/`, changeFrequency: 'yearly', priority: 0.2 },
  ]

  const categoriaPages: MetadataRoute.Sitemap = categorias.map((cat) => ({
    url: `${BASE}${cat.url_prefix}`,
    changeFrequency: 'hourly' as const,
    priority: 0.8,
  }))

  const artigoPages: MetadataRoute.Sitemap = slugs.map((item) => ({
    url: `${BASE}/${item.slug}`,
    lastModified: item.published_at ? new Date(item.published_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [...staticPages, ...categoriaPages, ...artigoPages]
}
