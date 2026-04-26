import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.r2.cloudflarestorage.com',
      },
      {
        protocol: 'https',
        hostname: '**.r2.dev',
      },
      {
        protocol: 'https',
        hostname: 'media.spassocidades.com.br',
      },
    ],
  },

  async redirects() {
    // Fontes SEM trailing slash — Next.js 15 normaliza para sem barra (308)
    // antes de aplicar redirects, então a source deve casar sem barra
    return [
      // ── Cidades ──────────────────────────────────────────
      // Sem trailing slash no destination — evita double redirect (301 + 308)
      { source: '/category/sumare',                           destination: '/sp/sumare',              permanent: true },
      { source: '/category/hortolandia',                      destination: '/sp/hortolandia',         permanent: true },
      { source: '/category/nova-odessa',                      destination: '/sp/nova-odessa',         permanent: true },
      { source: '/category/campinas',                         destination: '/sp/campinas',            permanent: true },
      { source: '/category/paulinia',                         destination: '/sp/paulinia',            permanent: true },
      { source: '/category/monte-mor',                        destination: '/sp/monte-mor',           permanent: true },
      { source: '/category/santa-barbara-doeste',             destination: '/sp/santa-barbara-doeste', permanent: true },
      { source: '/category/americana',                        destination: '/sp/outras-cidades',      permanent: true },
      { source: '/category/indaiatuba',                       destination: '/sp/outras-cidades',      permanent: true },
      { source: '/category/cidades-da-rmc',                   destination: '/rmc',                    permanent: true },
      { source: '/category/regiao-metropolitana-de-campinas', destination: '/rmc',                    permanent: true },
      { source: '/category/cidades-da-rmc/:slug',             destination: '/sp/:slug',               permanent: true },

      // ── Saúde ─────────────────────────────────────────────
      { source: '/category/saude',                  destination: '/saude',          permanent: true },
      { source: '/category/saude-e-bem-estar',      destination: '/saude',          permanent: true },
      { source: '/category/saude-mental',           destination: '/saude',          permanent: true },
      { source: '/category/saude-publica',          destination: '/saude',          permanent: true },

      // ── Política ──────────────────────────────────────────
      { source: '/category/politica',               destination: '/politica',       permanent: true },
      { source: '/category/politica-e-gestao',      destination: '/politica',       permanent: true },
      { source: '/category/politicas-publicas',     destination: '/politica',       permanent: true },
      { source: '/category/eleicoes',               destination: '/politica',       permanent: true },

      // ── Economia ──────────────────────────────────────────
      { source: '/category/economia',               destination: '/economia',       permanent: true },
      { source: '/category/economia-e-negocios',    destination: '/economia',       permanent: true },

      // ── Esporte ───────────────────────────────────────────
      { source: '/category/esporte',                destination: '/esporte',        permanent: true },
      { source: '/category/esportes',               destination: '/esporte',        permanent: true },

      // ── Cultura ───────────────────────────────────────────
      { source: '/category/cultura-e-lazer',        destination: '/cultura-e-lazer', permanent: true },
      { source: '/category/cultura',                destination: '/cultura-e-lazer', permanent: true },

      // ── Estilo de vida ────────────────────────────────────
      { source: '/category/gastronomia',            destination: '/estilo-de-vida', permanent: true },
      { source: '/category/moda',                   destination: '/estilo-de-vida', permanent: true },
      { source: '/category/tendencias',             destination: '/estilo-de-vida', permanent: true },
      { source: '/category/beleza',                 destination: '/estilo-de-vida', permanent: true },
      { source: '/category/comportamento',          destination: '/estilo-de-vida', permanent: true },
      { source: '/category/turismo',                destination: '/estilo-de-vida', permanent: true },
      { source: '/category/pets',                   destination: '/estilo-de-vida', permanent: true },
      { source: '/category/relacionamentos',        destination: '/estilo-de-vida', permanent: true },
      { source: '/category/decoracao',              destination: '/estilo-de-vida', permanent: true },
      { source: '/category/casa-e-decoracao',       destination: '/estilo-de-vida', permanent: true },
      { source: '/category/jardim',                 destination: '/estilo-de-vida', permanent: true },

      // ── Outros temas ──────────────────────────────────────
      { source: '/category/educacao',               destination: '/educacao',       permanent: true },
      { source: '/category/tecnologia',             destination: '/tecnologia',     permanent: true },
      { source: '/category/eventos',                destination: '/eventos',        permanent: true },
      { source: '/category/meio-ambiente',          destination: '/meio-ambiente',  permanent: true },
      { source: '/category/seguranca',              destination: '/seguranca',      permanent: true },
      { source: '/category/emprego',                destination: '/empregos',       permanent: true },
      { source: '/category/empregos',               destination: '/empregos',       permanent: true },
      { source: '/category/brasil',                 destination: '/brasil',         permanent: true },
      { source: '/category/infraestrutura',         destination: '/infraestrutura', permanent: true },

      // ── Colunistas (antigo Opinião / Politicando) ────────
      { source: '/category/politicando',            destination: '/colunistas',                          permanent: true },
      { source: '/category/opiniao',                destination: '/colunistas',                          permanent: true },
      { source: '/opiniao',                         destination: '/colunistas',                          permanent: true },
      { source: '/colunistas/politicando',          destination: '/colunistas/elaine-cristina-amaral',   permanent: true },

      // ── WP interno (→ home) ───────────────────────────────
      { source: '/category/featured',               destination: '/',               permanent: true },
      { source: '/category/destaque',               destination: '/',               permanent: true },
      { source: '/category/blog',                   destination: '/',               permanent: true },
      { source: '/category/td-demo/:path*',         destination: '/',               permanent: true },

      // ── Feed ──────────────────────────────────────────────
      { source: '/feed',                            destination: '/feed.xml',       permanent: true },
      { source: '/feed/',                           destination: '/feed.xml',       permanent: true },

      // ── Páginas estáticas (slugs WP antigos) ──────────────
      { source: '/politica-de-privacidade',         destination: '/privacidade',    permanent: true },
      { source: '/politica-de-privacidade/',        destination: '/privacidade',    permanent: true },
      { source: '/sobre-nos',                       destination: '/sobre',          permanent: true },
      { source: '/sobre-nos/',                      destination: '/sobre',          permanent: true },
    ]
  },
}

export default nextConfig
