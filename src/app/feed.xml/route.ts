import { getArtigosRecentes } from '@/lib/supabase/queries'

export const runtime = 'edge'

const BASE = 'https://jornalspassocidades.com.br'

export async function GET() {
  const artigos = await getArtigosRecentes(20)

  const items = artigos
    .map((a) => {
      const url = `${BASE}/${a.slug}/`
      const pubDate = a.published_at ? new Date(a.published_at).toUTCString() : new Date().toUTCString()
      const desc = (a.excerpt ?? '').replace(/<[^>]+>/g, '').slice(0, 300)
      return `
    <item>
      <title><![CDATA[${a.title}]]></title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${desc}]]></description>
      ${a.category_name ? `<category><![CDATA[${a.category_name}]]></category>` : ''}
      ${a.featured_image_url ? `<enclosure url="${a.featured_image_url}" type="image/jpeg" />` : ''}
    </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Spasso Cidades</title>
    <link>${BASE}</link>
    <description>O diário digital de Sumaré e região</description>
    <language>pt-br</language>
    <atom:link href="${BASE}/feed.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1800',
    },
  })
}
