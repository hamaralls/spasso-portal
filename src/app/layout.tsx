import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
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
  },
  twitter: {
    card: 'summary_large_image',
  },
  alternates: {
    canonical: '/',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-[#f5f5f5] text-[#1a1a1a] antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>

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
    </html>
  )
}
