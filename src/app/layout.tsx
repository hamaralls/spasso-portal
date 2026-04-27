import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import SocialStrip from '@/components/SocialStrip'
import AuthRecoveryRedirect from '@/components/AuthRecoveryRedirect'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Spasso Cidades — O diário digital de Sumaré e região',
    template: '%s | Spasso Cidades',
  },
  description: 'Cobertura completa de Sumaré e da Região Metropolitana de Campinas. Notícias, política, saúde, educação e mais.',
  metadataBase: new URL('https://jornalspassocidades.com.br'),
  openGraph: {
    siteName: 'Spasso Cidades',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: '/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Spasso Cidades — O diário digital de Sumaré e região',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
  },
  alternates: {
    canonical: '/',
  },
}

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Spasso Cidades',
  url: 'https://jornalspassocidades.com.br',
  description: 'O diário digital de Sumaré e região',
}

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'NewsMediaOrganization',
  name: 'Spasso Cidades',
  url: 'https://jornalspassocidades.com.br',
  logo: {
    '@type': 'ImageObject',
    url: 'https://jornalspassocidades.com.br/og-default.jpg',
    width: 1200,
    height: 630,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gamEnabled = !!process.env.NEXT_PUBLIC_GAM_NETWORK_CODE

  return (
    <html lang="pt-BR" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-white text-[#1a1a1a] antialiased">
        <AuthRecoveryRedirect />
        <SocialStrip />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />

      {/* GA4 */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-WMZFHJHV10"
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-WMZFHJHV10');
        `}
      </Script>

      {/* Google Ad Manager — ativo só quando NEXT_PUBLIC_GAM_NETWORK_CODE estiver configurado */}
      {gamEnabled && (
        <Script
          src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"
          strategy="afterInteractive"
        />
      )}
    </html>
  )
}
