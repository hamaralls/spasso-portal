import Link from 'next/link'
import Image from 'next/image'
import Badge from '@/components/Badge'
import ArticleCard from '@/components/ArticleCard'
import SectionHeader from '@/components/SectionHeader'
import { AdUnit } from '@/components/AdUnit'
import { getArtigosRecentes, getArtigosPorCategorias, getColunistas } from '@/lib/supabase/queries'

export const runtime = 'edge'

export default async function Home() {
  const [recentes, regiao, sumare, estiloDeVida, brasil, saude, politica, economia, opiniao, colunistas] = await Promise.all([
    getArtigosRecentes(21),
    getArtigosPorCategorias(['hortolandia', 'nova-odessa', 'campinas', 'paulinia', 'monte-mor', 'santa-barbara-doeste', 'outras-cidades', 'rmc'], 6),
    getArtigosPorCategorias(['sumare'], 4),
    getArtigosPorCategorias(['estilo-de-vida', 'cultura-e-lazer', 'eventos'], 6),
    getArtigosPorCategorias(['brasil'], 4),
    getArtigosPorCategorias(['saude'], 4),
    getArtigosPorCategorias(['politica'], 4),
    getArtigosPorCategorias(['economia'], 4),
    getArtigosPorCategorias(['colunistas'], 4),
    getColunistas(),
  ])

  const ultimas = recentes.slice(5, 21)

  return (
    <>
      {/* ── 1. Hero / Destaques ── */}
      {recentes.length >= 2 ? (
        <section className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-6">

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-5">

              {/* Artigo principal */}
              <Link href={`/${recentes[0].slug}`}
                className="group lg:col-span-2 flex flex-col sm:flex-row gap-4">
                <div className="sm:w-[55%] relative aspect-video overflow-hidden bg-gray-200 shrink-0">
                  {recentes[0].featured_image_url && (
                    <Image
                      src={recentes[0].featured_image_url}
                      alt={recentes[0].title}
                      fill
                      priority
                      className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, 40vw"
                    />
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

              {/* Artigo secundário */}
              <Link href={`/${recentes[1].slug}`} className="group flex flex-col">
                <div className="relative aspect-video overflow-hidden bg-gray-200">
                  {recentes[1].featured_image_url && (
                    <Image
                      src={recentes[1].featured_image_url}
                      alt={recentes[1].title}
                      fill
                      className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, 25vw"
                    />
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
                  <Link key={article.id} href={`/${article.slug}`}
                    className="group flex items-start gap-3">
                    <div className="relative w-16 h-12 shrink-0 overflow-hidden bg-gray-200">
                      {article.featured_image_url && (
                        <Image
                          src={article.featured_image_url}
                          alt={article.title}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {regiao.map((article) => (
                <ArticleCard key={article.id} article={article} size="featured" />
              ))}
            </div>
          </section>
        )}

        {/* ── 3. Sumaré ── */}
        {sumare.length > 0 && (
          <section>
            <SectionHeader title="Sumaré" href="/sp/sumare" color="#8dc63f" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ArticleCard article={sumare[0]} size="featured" />
              <div className="flex flex-col gap-4">
                {sumare.slice(1).map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            </div>
          </section>
        )}

        <AdUnit slot="home-leaderboard" format="leaderboard" className="flex justify-center" />

        {/* ── 4. Estilo de Vida ── */}
        {estiloDeVida.length > 0 && (
          <section>
            <SectionHeader title="Estilo de Vida" href="/estilo-de-vida" color="#f5821f" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {estiloDeVida.map((article) => (
                <ArticleCard key={article.id} article={article} size="featured" />
              ))}
            </div>
          </section>
        )}

        {/* ── 5. Brasil ── */}
        {brasil.length > 0 && (
          <section>
            <SectionHeader title="Brasil" href="/brasil" color="#ec3535" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ArticleCard article={brasil[0]} size="featured" />
              <div className="flex flex-col gap-4">
                {brasil.slice(1).map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            </div>
          </section>
        )}

        <AdUnit slot="home-leaderboard-2" format="leaderboard" className="flex justify-center" />

        {/* ── 6. Saúde (min 4 artigos) ── */}
        {saude.length >= 4 && (
          <section>
            <SectionHeader title="Saúde" href="/saude" color="#0891b2" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {saude.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}

        {/* ── 7. Política (min 4 artigos) ── */}
        {politica.length >= 4 && (
          <section>
            <SectionHeader title="Política" href="/politica" color="#7c3aed" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {politica.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}

        {/* ── 8. Economia (min 4 artigos) ── */}
        {economia.length >= 4 && (
          <section>
            <SectionHeader title="Economia" href="/economia" color="#16a34a" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {economia.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}

        {/* ── 9. Colunistas ── */}
        {(opiniao.length > 0 || colunistas.length > 0) && (
          <section>
            <SectionHeader title="Colunistas" href="/colunistas" color="#7c3aed" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {colunistas.map(col => {
                const initials = col.name
                  .split(' ').filter(Boolean)
                  .map((n: string) => n[0].toUpperCase())
                  .slice(0, 2).join('')
                const latestArticle = opiniao.find(a =>
                  a.author_name === col.name || a.origin_badge === col.name
                ) ?? opiniao[0]
                return (
                  <Link
                    key={col.id}
                    href="/colunistas"
                    className="group bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4"
                  >
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

        {/* ── 10. Últimas Notícias ── */}
        {ultimas.length > 0 && (
          <section>
            <SectionHeader title="Últimas Notícias" color="#f5821f" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {ultimas.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}

      </div>
    </>
  )
}
