import type { MetadataRoute } from 'next'

export const runtime = 'edge'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: 'facebookexternalhit',
        allow: '/',
      },
      {
        userAgent: 'Twitterbot',
        allow: '/',
      },
      {
        userAgent: 'WhatsApp',
        allow: '/',
      },
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
    ],
    sitemap: 'https://jornalspassocidades.com.br/sitemap.xml',
  }
}
