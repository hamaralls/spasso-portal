import Link from 'next/link'
import Image from 'next/image'
import Badge from '@/components/Badge'
import ArticleCard from '@/components/ArticleCard'
import SectionHeader from '@/components/SectionHeader'
import { AdUnit } from '@/components/AdUnit'
import { getArtigosRecentes, getArtigosPorCategorias, getColunistas } from '@/lib/supabase/queries'
import type { ArticlePublico } from '@/types'

export const runtime = 'edge'

const hasAds = !!process.env.NEXT_PUBLIC_GAM_NETWORK_CODE

function BannerPlaceholder({ w, h, label, fill }: { w: number; h: number; label: string; fill?: boolean }) {
  if (hasAds) return null
  if (fill) {
    return (
      <div className="w-full flex-1 min-h-[400px] bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400">
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
            <h3 className="text-base font-bold text-[#1a1a1a] leading-snug mt-1 group-hover:text-[#f5821f] transition-colors line-clamp-3">
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

// Layout Metrópoles — 15 artigos por seção
// Col 1+2: featured tall + 2 compact + 2 compact
// Col 3: 4 stacked
// + 2 linhas de 3 cards (full width, artigos 9-14)
function MetropolesGrid({ articles }: { articles: ArticlePublico[] }) {
  const a = articles
  if (a.length === 0) return null

  return (
    <div className="space-y-4">

      {/* Topo: col 1+2 (featured + compacts) + col 3 (stacked) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-6 gap-y-4 items-start">

        {/* Col 1+2 */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Featured: imagem esq (aspect 4:3) + badge + título dir */}
          {a[0] && (
            <Link href={`/${a[0].slug}`} className="group flex gap-4">
              <div className="relative w-[48%] aspect-[4/3] shrink-0 overflow-hidden bg-gray-200">
                {a[0].featured_image_url ? (
                  <Image
                    src={a[0].featured_image_url}
                    alt={a[0].title}
                    fill
                    className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    sizes="(max-width: 1024px) 50vw, 28vw"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200" />
                )}
              </div>
              <div className="flex-1 min-w-0 pt-1">
                {a[0].category_name && (
                  <Badge name={a[0].category_name} color={a[0].badge_color} size="sm" />
                )}
                <h3 className="text-xl font-bold leading-snug mt-2 group-hover:text-[#f5821f] transition-colors line-clamp-4 text-[#1a1a1a]">
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

          {/* Compact row 1: artigos 1 e 2 */}
          {a.length >= 3 && (
            <div className="grid grid-cols-2 gap-4">
              {a.slice(1, 3).map(art => (
                <ArticleCard key={art.id} article={art} size="compact" />
              ))}
            </div>
          )}

          {/* Compact row 2: artigos 3 e 4 (com foto) */}
          {a.length >= 5 && (
            <div className="grid grid-cols-2 gap-4">
              {a.slice(3, 5).map(art => (
                <ArticleCard key={art.id} article={art} size="compact" />
              ))}
            </div>
          )}
        </div>

        {/* Col 3: 5 stacked sem dividers — preenche altura da col 1+2 */}
        <div className="hidden lg:flex flex-col gap-3">
          {a.slice(5, 10).map(art => (
            <ArticleCard key={art.id} article={art} size="compact" />
          ))}
        </div>
      </div>

      {/* Linha extra 1: 3 cards (artigos 10-12) */}
      {a.length >= 11 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {a.slice(10, 13).map(art => (
            <ArticleCard key={art.id} article={art} size="compact" />
          ))}
        </div>
      )}

      {/* Linha extra 2: 3 cards (artigos 13-15) */}
      {a.length >= 14 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {a.slice(13, 16).map(art => (
            <ArticleCard key={art.id} article={art} size="compact" />
          ))}
        </div>
      )}

    </div>
  )
}

export default async function Home() {
  const [recentes, regiao, culturaELazer, brasil, saude, politica, economia, opiniao, colunistas] = await Promise.all([
    getArtigosRecentes(17),
    getArtigosPorCategorias(['sumare', 'hortolandia', 'nova-odessa', 'campinas', 'paulinia', 'monte-mor', 'santa-barbara-doeste', 'outras-cidades', 'rmc'], 16),
    getArtigosPorCategorias(['estilo-de-vida', 'cultura-e-lazer', 'eventos'], 16),
    getArtigosPorCategorias(['brasil'], 16),
    getArtigosPorCategorias(['saude'], 16),
    getArtigosPorCategorias(['politica'], 6),
    getArtigosPorCategorias(['economia'], 16),
    getArtigosPorCategorias(['colunistas'], 4),
    getColunistas(),
  ])

  const ultimas = recentes.slice(5, 17)

  return (
    <>
      {/* ── 1. Hero / Destaques ── */}
      {recentes.length >= 2 ? (
        <section className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-6">

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-5">
              {/* Principal */}
              <Link href={`/${recentes[0].slug}`}
                className="group lg:col-span-2 flex flex-col sm:flex-row gap-4">
                <div className="sm:w-[55%] relative aspect-video overflow-hidden bg-gray-200 shrink-0">
                  {recentes[0].featured_image_url && (
                    <Image src={recentes[0].featured_image_url} alt={recentes[0].title}
                      fill priority className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, 40vw" />
                  )}
                </div>
                <div className="sm:w-[45%] flex flex-col justify-start pt-1">
                  {recentes[0].category_name && (
                    <Badge name={recentes[0].category_name} color={recentes[0].badge_color} size="sm" />
                  )}
                  <h1 className="text-xl md:text-2xl font-bold leading-snug mt-2 group-hover:underline line-clamp-4 text-[#1a1a1a]">
                    {recentes[0].title}
                  </h1>
                  {recentes[0].excerpt && (
                    <p className="text-sm text-gray-500 mt-2 line-clamp-3 leading-relaxed">
                      {recentes[0].excerpt.replace(/<[^>]+>/g, '')}
                    </p>
                  )}
                  {recentes[0].author_name && (
                    <p className="mt-auto pt-3 text-xs text-gray-400">{recentes[0].author_name}</p>
                  )}
                </div>
              </Link>

              {/* Secundário */}
              <Link href={`/${recentes[1].slug}`} className="group flex flex-col">
                <div className="relative aspect-video overflow-hidden bg-gray-200">
                  {recentes[1].featured_image_url && (
                    <Image src={recentes[1].featured_image_url} alt={recentes[1].title}
                      fill className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, 25vw" />
                  )}
                </div>
                <p className="text-[#f5821f] text-xs font-bold mt-2 uppercase tracking-wide truncate">
                  {recentes[1].author_name ?? recentes[1].category_name ?? ''}
                </p>
                <h2 className="text-base font-bold leading-snug mt-1 group-hover:underline line-clamp-3 text-[#1a1a1a]">
                  {recentes[1].title}
                </h2>
              </Link>
            </div>

            {/* Faixa inferior — 3 thumbnails */}
            {recentes.length >= 5 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-3 pt-4 border-t border-gray-200">
                {recentes.slice(2, 5).map((article) => (
                  <Link key={article.id} href={`/${article.slug}`} className="group flex items-start gap-3">
                    <div className="relative w-16 h-12 shrink-0 overflow-hidden bg-gray-200">
                      {article.featured_image_url && (
                        <Image src={article.featured_image_url} alt={article.title}
                          fill className="object-cover" sizes="64px" />
                      )}
                    </div>
                    <p className="text-sm font-semibold leading-snug group-hover:text-[#f5821f] transition-colors line-clamp-2 text-[#1a1a1a]">
                      {article.title}
                    </p>
                  </Link>
                ))}
              </div>
            )}
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

        {/* ── 2. Região Metropolitana de Campinas ── */}
        {regiao.length > 0 && (
          <section>
            <SectionHeader title="Região Metropolitana de Campinas" href="/rmc" color="#8dc63f" />
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-stretch">
              <div className="lg:col-span-3">
                <MetropolesGrid articles={regiao} />
              </div>
              <aside className="hidden lg:flex flex-col">
                <AdUnit slot="rmc-sidebar" format="rectangle" />
                <BannerPlaceholder w={300} h={300} label="Banner 300×600" fill />
              </aside>
            </div>
          </section>
        )}

        {/* ── Leaderboard entre RMC e Colunistas ── */}
        <div className="flex justify-center">
          <AdUnit slot="home-leaderboard" format="leaderboard" />
          <BannerPlaceholder w={728} h={90} label="Banner 728×90" />
        </div>

        {/* ── 3. Colunistas ── */}
        {(opiniao.length > 0 || colunistas.length > 0) && (
          <section>
            <SectionHeader title="Colunistas" href="/colunistas" color="#7c3aed" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {colunistas.map(col => {
                const initials = col.name.split(' ').filter(Boolean)
                  .map((n: string) => n[0].toUpperCase()).slice(0, 2).join('')
                const latestArticle = opiniao.find(a =>
                  a.author_name === col.name || a.origin_badge === col.name
                ) ?? opiniao[0]
                return (
                  <Link key={col.id} href="/colunistas"
                    className="group bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center shrink-0"
                      style={{ background: col.type === 'person' && col.avatar_url ? undefined : '#7c3aed1a' }}>
                      {col.type === 'person' && col.avatar_url ? (
                        <Image src={col.avatar_url} alt={col.name} width={56} height={56} className="object-cover w-full h-full" />
                      ) : (
                        <span className="text-xl font-extrabold text-[#7c3aed]">{initials}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#7c3aed] uppercase tracking-wide truncate">{col.name}</p>
                      {latestArticle && (
                        <p className="text-xs text-gray-500 line-clamp-2 mt-0.5 leading-snug group-hover:text-[#7c3aed] transition-colors">
                          {latestArticle.title}
                        </p>
                      )}
                    </div>
                  </Link>
                )
              })}
              {colunistas.length === 0 && opiniao.map((article) => (
                <ArticleCard key={article.id} article={article} size="columnist" />
              ))}
            </div>
          </section>
        )}

        {/* ── 4. Brasil — MetropolesGrid Grande ── */}
        {brasil.length > 0 && (
          <section>
            <SectionHeader title="Brasil" href="/brasil" color="#ec3535" />
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-stretch">
              <div className="lg:col-span-3">
                <MetropolesGrid articles={brasil} />
              </div>
              <aside className="hidden lg:flex flex-col">
                <AdUnit slot="brasil-sidebar" format="rectangle" />
                <BannerPlaceholder w={300} h={300} label="Banner 300×600" fill />
              </aside>
            </div>
          </section>
        )}

        {/* ── 5. Cultura e Lazer — MetropolesGrid Grande ── */}
        {culturaELazer.length > 0 && (
          <section>
            <SectionHeader title="Cultura e Lazer" href="/cultura-e-lazer" color="#db2777" />
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-stretch">
              <div className="lg:col-span-3">
                <MetropolesGrid articles={culturaELazer} />
              </div>
              <aside className="hidden lg:flex flex-col">
                <AdUnit slot="cultura-sidebar" format="rectangle" />
                <BannerPlaceholder w={300} h={300} label="Banner 300×600" fill />
              </aside>
            </div>
          </section>
        )}

        {/* ── 6. Saúde — MetropolesGrid Adaptativo ── */}
        {saude.length >= 3 && (
          <section>
            <SectionHeader title="Saúde" href="/saude" color="#0891b2" />
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-stretch">
              <div className="lg:col-span-3">
                <MetropolesGrid articles={saude} />
              </div>
              <aside className="hidden lg:flex flex-col">
                <AdUnit slot="saude-sidebar" format="rectangle" />
                <BannerPlaceholder w={300} h={300} label="Banner 300×600" fill />
              </aside>
            </div>
          </section>
        )}

        {/* ── 7. Política — DestaqueGrid (seção pequena) ── */}
        {politica.length >= 2 && (
          <section>
            <SectionHeader title="Política" href="/politica" color="#7c3aed" />
            <DestaqueGrid articles={politica} />
          </section>
        )}

        {/* ── 8. Economia — MetropolesGrid Adaptativo ── */}
        {economia.length >= 3 && (
          <section>
            <SectionHeader title="Economia" href="/economia" color="#16a34a" />
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-stretch">
              <div className="lg:col-span-3">
                <MetropolesGrid articles={economia} />
              </div>
              <aside className="hidden lg:flex flex-col">
                <AdUnit slot="economia-sidebar" format="rectangle" />
                <BannerPlaceholder w={300} h={300} label="Banner 300×600" fill />
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
