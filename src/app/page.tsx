import Link from 'next/link'
import Image from 'next/image'
import Badge from '@/components/Badge'
import ArticleCard from '@/components/ArticleCard'
import SectionHeader from '@/components/SectionHeader'
import { AdUnit } from '@/components/AdUnit'
import { getArtigosRecentes, getArtigosPorCategorias, getColunistas, getArtigosDestaque } from '@/lib/supabase/queries'
import { timeAgo } from '@/lib/format'

export const runtime = 'edge'

export default async function Home() {
  const [recentes, destaques, regiao, sumare, brasil, saude, politica, economia, educacao, cultura, esporte, eventos, opiniao, colunistas] = await Promise.all([
    getArtigosRecentes(17),
    getArtigosDestaque(3),
    getArtigosPorCategorias(['hortolandia', 'nova-odessa', 'campinas', 'paulinia', 'monte-mor', 'santa-barbara-doeste'], 4),
    getArtigosPorCategorias(['sumare'], 3),
    getArtigosPorCategorias(['brasil'], 3),
    getArtigosPorCategorias(['saude'], 4),
    getArtigosPorCategorias(['politica'], 4),
    getArtigosPorCategorias(['economia'], 4),
    getArtigosPorCategorias(['educacao'], 4),
    getArtigosPorCategorias(['cultura-e-lazer'], 4),
    getArtigosPorCategorias(['esporte'], 4),
    getArtigosPorCategorias(['eventos'], 4),
    getArtigosPorCategorias(['colunistas'], 4),
    getColunistas(),
  ])

  const gridArticles = recentes.slice(5, 17)

  return (
    <>
      {/* ── Hero estilo Metrópoles ── */}
      {recentes.length >= 2 ? (
        <section className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-6">

            {/* Linha principal: artigo principal (2/3) + secundário (1/3) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-5">

              {/* Artigo principal */}
              <Link href={`/${recentes[0].slug}`}
                className="group lg:col-span-2 flex flex-col sm:flex-row gap-4">
                <div className="sm:w-[55%] relative aspect-[4/3] overflow-hidden rounded-lg bg-gray-200 shrink-0">
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
                  <div className="mt-auto pt-3 text-xs text-gray-400">
                    {recentes[0].author_name && <span>{recentes[0].author_name} · </span>}
                    {timeAgo(recentes[0].published_at)}
                  </div>
                </div>
              </Link>

              {/* Artigo secundário */}
              <Link href={`/${recentes[1].slug}`} className="group flex flex-col">
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-gray-200">
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

            {/* Faixa inferior — 3 títulos com bullet */}
            {recentes.length >= 5 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-3 pt-4 border-t border-gray-200">
                {recentes.slice(2, 5).map((article) => (
                  <Link key={article.id} href={`/${article.slug}`}
                    className="group flex items-start gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#f5821f] shrink-0 mt-[3px]" />
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

        {/* Mais Lidos — top 3 por views (últimos 7 dias) */}
        {destaques.length > 0 && (
          <section>
            <SectionHeader title="Mais Lidos" color="#f5821f" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {destaques.map((article) => (
                <ArticleCard key={article.id} article={article} size="featured" />
              ))}
            </div>
          </section>
        )}

        {/* Últimas notícias */}
        {gridArticles.length > 0 && (
          <section>
            <SectionHeader title="Últimas Notícias" color="#f5821f" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="col-span-2">
                <ArticleCard article={gridArticles[0]} size="featured" />
              </div>
              {gridArticles.slice(1, 3).map((article) => (
                <ArticleCard key={article.id} article={article} size="featured" />
              ))}
              {gridArticles.slice(3).map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}

        <AdUnit slot="home-leaderboard" format="leaderboard" className="flex justify-center" />

        {/* Região Metropolitana de Campinas */}
        {regiao.length > 0 && (
          <section>
            <SectionHeader title="Região Metropolitana de Campinas" href="/rmc" color="#8dc63f" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ArticleCard article={regiao[0]} size="featured" />
              <div className="flex flex-col gap-4">
                {regiao.slice(1).map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Sumaré */}
        {sumare.length > 0 && (
          <section>
            <SectionHeader title="Sumaré" href="/sp/sumare" color="#8dc63f" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <ArticleCard article={sumare[0]} size="featured" />
              </div>
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sumare.slice(1).map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Colunistas */}
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

        {/* Brasil */}
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

        {/* Saúde */}
        {saude.length > 0 && (
          <section>
            <SectionHeader title="Saúde" href="/saude" color="#0891b2" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {saude.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}

        {/* Política */}
        {politica.length > 0 && (
          <section>
            <SectionHeader title="Política" href="/politica" color="#7c3aed" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {politica.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}

        {/* Economia */}
        {economia.length > 0 && (
          <section>
            <SectionHeader title="Economia" href="/economia" color="#16a34a" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {economia.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}

        {/* Educação */}
        {educacao.length > 0 && (
          <section>
            <SectionHeader title="Educação" href="/educacao" color="#d97706" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {educacao.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}

        {/* Cultura e Lazer */}
        {cultura.length > 0 && (
          <section>
            <SectionHeader title="Cultura e Lazer" href="/cultura-e-lazer" color="#db2777" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {cultura.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}

        {/* Esporte */}
        {esporte.length > 0 && (
          <section>
            <SectionHeader title="Esporte" href="/esporte" color="#059669" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {esporte.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}

        {/* Entretenimento */}
        {eventos.length > 0 && (
          <section>
            <SectionHeader title="Entretenimento" href="/eventos" color="#ea580c" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {eventos.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}

        <AdUnit slot="home-leaderboard-2" format="leaderboard" className="flex justify-center" />

      </div>
    </>
  )
}
