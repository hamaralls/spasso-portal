import Link from 'next/link'
import Image from 'next/image'
import Badge from '@/components/Badge'
import ArticleCard from '@/components/ArticleCard'
import SectionHeader from '@/components/SectionHeader'
import { AdUnit } from '@/components/AdUnit'
import { getArtigosHero, getArtigosRecentes, getArtigosPorCategorias, getArtigosPorTema, getColunistas, getUltimaEdicao } from '@/lib/supabase/queries'
import EdicaoSemanalWidget from '@/components/EdicaoSemanalWidget'
import type { ArticlePublico } from '@/types'

export const runtime = 'edge'

const hasAds = !!process.env.NEXT_PUBLIC_GAM_NETWORK_CODE

function BannerPlaceholder({ w, h, label, fill, minH }: { w: number; h: number; label: string; fill?: boolean; minH?: number }) {
  if (hasAds) return null
  if (fill) {
    return (
      <div
        className="w-full flex-1 bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400"
        style={{ minHeight: minH ?? 150 }}
      >
        {label}
      </div>
    )
  }
  return (
    <div
      style={{ width: w, height: h }}
      className="bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400 mx-auto"
    >
      {label}
    </div>
  )
}

// Layout Destaque — seções pequenas (< 8 artigos)
// 1 featured vertical (col 1) + lista de compacts (col 2+3)
function DestaqueGrid({ articles }: { articles: ArticlePublico[] }) {
  const a = articles
  if (a.length === 0) return null
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <div>
        <Link href={`/${a[0].slug}`} className="group block">
          <div className="relative aspect-video overflow-hidden bg-gray-200">
            {a[0].featured_image_url ? (
              <Image src={a[0].featured_image_url} alt={a[0].title} fill
                className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                sizes="(max-width: 1024px) 100vw, 25vw" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200" />
            )}
          </div>
          <div className="pt-2">
            {a[0].category_name && <Badge name={a[0].category_name} color={a[0].badge_color} size="sm" />}
            <h3 className="text-base font-bold text-[#1a1a1a] leading-snug mt-1 group-hover:underline line-clamp-3">
              {a[0].title}
            </h3>
            {a[0].excerpt && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                {a[0].excerpt.replace(/<[^>]+>/g, '')}
              </p>
            )}
          </div>
        </Link>
      </div>
      <div className="lg:col-span-2 flex flex-col gap-3">
        {a.slice(1).map(art => (
          <ArticleCard key={art.id} article={art} size="compact" />
        ))}
      </div>
    </div>
  )
}

// extraRows: 0 = só topo, 1 = +1 linha, 2 = +2 linhas (padrão RMC)
// col3Count: cards empilhados na col 3. 0 = sem col 3 (wideLayout)
// wideLayout: col 1+2 ocupa 3 cols, compact rows com 3 cards — ideal para seções pequenas
function MetropolesGrid({
  articles,
  extraRows = 2,
  col3Count = 5,
  wideLayout = false,
}: {
  articles: ArticlePublico[]
  extraRows?: number
  col3Count?: number
  wideLayout?: boolean
}) {
  const a = articles
  if (a.length === 0) return null
  const col3End = wideLayout ? 1 : 5 + col3Count
  const compactCols = wideLayout ? 3 : 2
  const compactStart = 1
  const compactRow2Start = wideLayout ? 4 : 3

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-6 gap-y-4 items-start">

        {/* Col 1+2 (ou col-span-3 no wideLayout) */}
        <div className={`${wideLayout ? 'lg:col-span-3' : 'lg:col-span-2'} flex flex-col gap-4`}>
          {a[0] && (
            <Link href={`/${a[0].slug}`} className="group flex gap-4">
              <div className="relative w-[48%] aspect-[4/3] shrink-0 overflow-hidden bg-gray-200">
                {a[0].featured_image_url ? (
                  <Image src={a[0].featured_image_url} alt={a[0].title} fill
                    className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    sizes="(max-width: 1024px) 50vw, 28vw" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200" />
                )}
              </div>
              <div className="flex-1 min-w-0 pt-1">
                {a[0].category_name && <Badge name={a[0].category_name} color={a[0].badge_color} size="sm" />}
                <h3 className="text-xl font-bold leading-snug mt-2 group-hover:underline line-clamp-4 text-[#1a1a1a]">
                  {a[0].title}
                </h3>
                {a[0].excerpt && (
                  <p className="text-sm text-gray-500 mt-2 line-clamp-3 leading-relaxed">
                    {a[0].excerpt.replace(/<[^>]+>/g, '')}
                  </p>
                )}
              </div>
            </Link>
          )}
          {a.length >= compactStart + 2 && (
            <div className={`grid grid-cols-${compactCols} gap-4`}>
              {a.slice(compactStart, compactStart + compactCols).map(art => (
                <ArticleCard key={art.id} article={art} size="compact" />
              ))}
            </div>
          )}
          {a.length >= compactRow2Start + 2 && (
            <div className={`grid grid-cols-${compactCols} gap-4`}>
              {a.slice(compactRow2Start, compactRow2Start + compactCols).map(art => (
                <ArticleCard key={art.id} article={art} size="compact" />
              ))}
            </div>
          )}
        </div>

        {/* Col 3: stacked (oculto no wideLayout) */}
        {!wideLayout && (
          <div className="hidden lg:flex flex-col gap-3">
            {a.slice(5, col3End).map(art => (
              <ArticleCard key={art.id} article={art} size="compact" />
            ))}
          </div>
        )}
      </div>

      {extraRows >= 1 && a.length >= col3End + 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {a.slice(col3End, col3End + 3).map(art => (
            <ArticleCard key={art.id} article={art} size="compact" />
          ))}
        </div>
      )}

      {extraRows >= 2 && a.length >= col3End + 4 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {a.slice(col3End + 3, col3End + 6).map(art => (
            <ArticleCard key={art.id} article={art} size="compact" />
          ))}
        </div>
      )}
    </div>
  )
}

export default async function Home() {
  const [hero, ultimas, regiaoRaw, culturaELazarRaw, brasilRaw, saudeRaw, politicaRaw, economiaRaw, colunistas, ultimaEdicao] = await Promise.all([
    getArtigosHero(),
    getArtigosRecentes(12),
    getArtigosPorCategorias(['sumare', 'hortolandia', 'nova-odessa', 'campinas', 'paulinia', 'monte-mor', 'santa-barbara-doeste', 'outras-cidades', 'rmc'], 16),
    getArtigosPorCategorias(['estilo-de-vida', 'cultura-e-lazer', 'eventos'], 10),
    getArtigosPorCategorias(['brasil'], 10),
    getArtigosPorTema('saude', 10),
    getArtigosPorTema('politica', 6),
    getArtigosPorTema('economia', 10),
    getColunistas(),
    getUltimaEdicao(),
  ])

  // Deduplica: artigos do hero não aparecem novamente nas seções
  const heroIds = new Set(hero.map((a: ArticlePublico) => a.id))
  const dedupe = (arr: ArticlePublico[]) => arr.filter(a => !heroIds.has(a.id))
  const regiao      = dedupe(regiaoRaw)
  const culturaELazer = dedupe(culturaELazarRaw)
  const brasil      = dedupe(brasilRaw)
  const saude       = dedupe(saudeRaw)
  const politica    = dedupe(politicaRaw)
  const economia    = dedupe(economiaRaw)

  return (
    <>
      {/* ── 1. Hero / Destaques ── */}
      {hero.length >= 2 ? (
        <section className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-6">

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-5">
              {/* Principal */}
              <Link href={`/${hero[0].slug}`}
                className="group lg:col-span-3 flex flex-col sm:flex-row gap-6">
                <div className="sm:w-[60%] relative aspect-video overflow-hidden bg-gray-200 shrink-0">
                  {hero[0].featured_image_url && (
                    <Image src={hero[0].featured_image_url} alt={hero[0].title}
                      fill priority className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, 60vw" />
                  )}
                </div>
                <div className="sm:w-[40%] flex flex-col justify-start pt-1">
                  {hero[0].category_name && (
                    <Badge name={hero[0].category_name} color={hero[0].badge_color} size="sm" />
                  )}
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold leading-tight mt-2 group-hover:underline line-clamp-5 text-[#1a1a1a]">
                    {hero[0].title}
                  </h1>
                  {hero[0].excerpt && (
                    <p className="text-sm text-gray-500 mt-2 line-clamp-3 leading-relaxed">
                      {hero[0].excerpt.replace(/<[^>]+>/g, '')}
                    </p>
                  )}
                  {hero[0].author_name && (
                    <p className="mt-auto pt-3 text-xs text-gray-400">{hero[0].author_name}</p>
                  )}
                </div>
              </Link>

              {/* Secundário (Lista de 3) */}
              <div className="flex flex-col gap-4 justify-between h-full">
                {hero.slice(1, 4).map(article => (
                  <Link key={article.id} href={`/${article.slug}`} className="group flex items-start gap-3">
                    <div className="relative w-24 h-24 shrink-0 overflow-hidden bg-gray-200">
                      {article.featured_image_url ? (
                        <Image src={article.featured_image_url} alt={article.title}
                          fill className="object-cover group-hover:scale-[1.02] transition-transform duration-300" sizes="96px" />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center h-full pt-1">
                      <p className="text-[10px] font-bold uppercase tracking-wide truncate mb-1" style={{ color: article.badge_color || '#f5821f' }}>
                        {article.author_name ?? article.category_name ?? ''}
                      </p>
                      <h2 className="text-sm font-bold leading-snug group-hover:underline line-clamp-4 text-[#1a1a1a]">
                        {article.title}
                      </h2>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="bg-white py-12">
          <div className="max-w-7xl mx-auto px-4 text-center text-gray-400">
            <p className="text-lg">Portal em preparação. Notícias em breve!</p>
          </div>
        </section>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">

        {/* ── 3. Colunistas ── */}
        {colunistas.length > 0 && (
          <section>
            <SectionHeader title="Colunistas" href="/colunistas" color="#f5821f" />
            <div className={`grid gap-4 ${
              colunistas.length === 1 ? 'grid-cols-1 max-w-sm' :
              colunistas.length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl' :
              'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            }`}>
              {colunistas.map(col => {
                const initials = col.name.split(' ').filter(Boolean)
                  .map((n: string) => n[0].toUpperCase()).slice(0, 2).join('')
                const href = `/colunistas/${col.slug}`
                return (
                  <Link key={col.id} href={href}
                    className="group flex items-start gap-3 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
                      style={{ background: col.avatar_url ? undefined : '#f5821f1a' }}>
                      {col.avatar_url ? (
                        <Image src={col.avatar_url} alt={col.name} width={48} height={48}
                          className="object-cover w-full h-full" />
                      ) : (
                        <span className="text-base font-extrabold text-[#f5821f]">{initials}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#f5821f] uppercase tracking-wide truncate mb-0.5">
                        {col.name}
                      </p>
                      {col.lastArticle && (
                        <>
                          <p className="text-sm font-semibold text-[#1a1a1a] leading-snug line-clamp-1 group-hover:underline">
                            {col.lastArticle.title}
                          </p>
                          {col.lastArticle.excerpt && (
                            <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mt-0.5">
                              {col.lastArticle.excerpt.replace(/<[^>]+>/g, '')}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}


        {/* ── 2. Região Metropolitana de Campinas ── */}
        {regiao.length > 0 && (
          <section>
            <SectionHeader title="Região Metropolitana de Campinas" href="/rmc" color="#8dc63f" />
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
              <div className="lg:col-span-3">
                <MetropolesGrid articles={regiao} />
              </div>
              <aside className="hidden lg:flex flex-col gap-4">
                {ultimaEdicao && <EdicaoSemanalWidget edition={ultimaEdicao} />}
                <AdUnit slot="rmc-sidebar" format="rectangle" />
              </aside>
            </div>
          </section>
        )}

        {/* ── Leaderboard entre RMC e Colunistas ── */}
        <div className="flex justify-center">
          <AdUnit slot="home-leaderboard" format="leaderboard" />
          <BannerPlaceholder w={728} h={90} label="Banner 728×90" />
        </div>

        {/* ── Siga-nos ── */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 py-2">
          <span className="text-sm font-semibold text-gray-400">Siga o Spasso Cidades:</span>
          <div className="flex gap-3">
            <a href="https://www.facebook.com/jornalspassocidades" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1877F2] text-white text-sm font-semibold hover:bg-[#0d6de0] transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.791-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
              Facebook
            </a>
            <a href="https://www.instagram.com/spassocidades" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              Instagram
            </a>
          </div>
        </div>

        {/* ── 4. Brasil — MetropolesGrid, sem extras ── */}
        {brasil.length > 0 && (
          <section>
            <SectionHeader title="Brasil" href="/brasil" color="#ec3535" />
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-stretch">
              <div className="lg:col-span-3">
                <MetropolesGrid articles={brasil} extraRows={0} />
              </div>
              <aside className="hidden lg:flex flex-col">
                <AdUnit slot="brasil-sidebar" format="rectangle" />
                <BannerPlaceholder w={300} h={300} label="Banner 300×400" fill minH={300} />
              </aside>
            </div>
          </section>
        )}

        {/* ── 5. Cultura e Lazer — MetropolesGrid, sem extras ── */}
        {culturaELazer.length > 0 && (
          <section>
            <SectionHeader title="Cultura e Lazer" href="/cultura-e-lazer" color="#db2777" />
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-stretch">
              <div className="lg:col-span-3">
                <MetropolesGrid articles={culturaELazer} extraRows={0} />
              </div>
              <aside className="hidden lg:flex flex-col">
                <AdUnit slot="cultura-sidebar" format="rectangle" />
                <BannerPlaceholder w={300} h={300} label="Banner 300×400" fill minH={300} />
              </aside>
            </div>
          </section>
        )}

        {/* ── 6. Saúde — MetropolesGrid, sem extras ── */}
        {saude.length >= 3 && (
          <section>
            <SectionHeader title="Saúde" href="/saude" color="#0891b2" />
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-stretch">
              <div className="lg:col-span-3">
                <MetropolesGrid articles={saude} extraRows={0} />
              </div>
              <aside className="hidden lg:flex flex-col">
                <AdUnit slot="saude-sidebar" format="rectangle" />
                <BannerPlaceholder w={300} h={300} label="Banner 300×400" fill minH={300} />
              </aside>
            </div>
          </section>
        )}

        {/* ── 7. Política — flex row: texto esq cresce, img dir w-[42%] h-auto ── */}
        {politica.length >= 2 && (
          <section>
            <SectionHeader title="Política" href="/politica" color="#7c3aed" />

            {/* Destaque principal — flex stretch: imagem se adapta à altura do texto */}
            <Link href={`/${politica[0].slug}`}
              className="group flex flex-col md:flex-row gap-5 pb-5 border-b border-gray-100 mb-3">
              {/* Texto esquerda */}
              <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
                <h2 className="text-2xl md:text-3xl font-extrabold text-[#1a1a1a] leading-snug group-hover:underline">
                  {politica[0].title}
                </h2>
                {politica[0].excerpt && (
                  <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">
                    {politica[0].excerpt.replace(/<[^>]+>/g, '')}
                  </p>
                )}
                {politica[0].author_name && (
                  <p className="text-xs font-semibold text-[#7c3aed]">{politica[0].author_name}</p>
                )}
              </div>
              {/* Imagem direita — sem ratio fixo no desktop, estica com o texto */}
              {politica[0].featured_image_url && (
                <div className="w-full md:w-[42%] shrink-0 aspect-[4/3] md:aspect-auto overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={politica[0].featured_image_url}
                    alt={politica[0].title}
                    className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-300"
                  />
                </div>
              )}
            </Link>

            {/* Secundários — grid 2×2 com thumb 10:9, padrão dos cards do portal */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              {politica.slice(1, 5).map((artigo) => (
                <Link key={artigo.id} href={`/${artigo.slug}`} className="group flex flex-col gap-2">
                  <div className="aspect-[10/9] overflow-hidden bg-gray-100">
                    {artigo.featured_image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={artigo.featured_image_url}
                        alt={artigo.title}
                        className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-300"
                      />
                    )}
                  </div>
                  <p className="text-sm font-semibold text-[#1a1a1a] leading-snug group-hover:underline line-clamp-2">
                    {artigo.title}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── 8. Economia — MetropolesGrid, sem extras ── */}
        {economia.length >= 3 && (
          <section>
            <SectionHeader title="Economia" href="/economia" color="#16a34a" />
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-stretch">
              <div className="lg:col-span-3">
                <MetropolesGrid articles={economia} extraRows={0} />
              </div>
              <aside className="hidden lg:flex flex-col">
                <AdUnit slot="economia-sidebar" format="rectangle" />
                <BannerPlaceholder w={300} h={300} label="Banner 300×400" fill minH={300} />
              </aside>
            </div>
          </section>
        )}

        {/* ── 9. Últimas Notícias ── */}
        {ultimas.length > 0 && (
          <section>
            <SectionHeader title="Últimas Notícias" color="#f5821f" />
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
              <div className="lg:col-span-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ultimas.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </div>
              <aside className="hidden lg:flex flex-col items-center pt-1">
                <AdUnit slot="ultimas-sidebar" format="rectangle" />
                <BannerPlaceholder w={300} h={250} label="Banner 300×250" />
              </aside>
            </div>
          </section>
        )}

      </div>
    </>
  )
}
