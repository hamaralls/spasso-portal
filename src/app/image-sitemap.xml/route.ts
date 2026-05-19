import { getAllArtigosParaImageSitemap } from '@/lib/supabase/queries'

export const runtime = 'edge'
// Regenera no schedule (1h) em vez de no cache-miss sob demanda. Casa com o
// s-maxage=3600 da resposta e tira o pico de gerar ~4k artigos por request
// edge — gatilho provável do Cloudflare Error 1102. Ver produto/PORTAL-ERROR-1102-PLANO.md.
export const revalidate = 3600

const BASE = 'https://jornalspassocidades.com.br'

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const artigos = await getAllArtigosParaImageSitemap().catch(() => [])

  const urls = artigos
    .filter((a) => a.slug && a.featured_image_url)
    .map((a) => {
      const url = `${BASE}/${a.slug}`
      const imageLoc = escapeXml(a.featured_image_url!)
      const title = escapeXml(a.title || '')
      const caption = a.featured_image_caption || a.featured_image_alt || a.title || ''
      const captionXml = caption ? `      <image:caption>${escapeXml(caption)}</image:caption>` : ''
      return `  <url>
    <loc>${escapeXml(url)}</loc>
    <image:image>
      <image:loc>${imageLoc}</image:loc>
      <image:title>${title}</image:title>
${captionXml}
    </image:image>
  </url>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
