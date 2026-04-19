import Link from 'next/link'
import Image from 'next/image'
import Badge from '@/components/Badge'
import ArticleCard from '@/components/ArticleCard'
import SectionHeader from '@/components/SectionHeader'
import { AdUnit } from '@/components/AdUnit'
import { getArtigosRecentes, getArtigosPorCategorias } from '@/lib/supabase/queries'
import { timeAgo } from '@/lib/format'

export const runtime = 'edge'

export default async function Home() {
  const [recentes, sumare, regiao, brasil, saude, politica, economia, educacao, cultura, esporte, eventos, opiniao] = await Promise.all([
    getArtigosRecentes(13),
    getArtigosPorCategorias(['sumare'], 3),
    getArtigosPorCategorias(['hortolandia', 'nova-odessa', 'campinas', 'paulinia', 'monte-mor'], 3),
    getArtigosPorCategorias(['brasil'], 3),
    getArtigosPorCategorias(['saude'], 3),
    getArtigosPorCategorias(['politica'], 3),
    getArtigosPorCategorias(['economia'], 3),
    getArtigosPorCategorias(['educacao'], 3),
    getArtigosPorCategorias(['cultura-e-lazer'], 3),
    getArtigosPorCategorias(['esporte'], 3),
    getArtigosPorCategorias(['eventos'], 3),
    getArtigosPorCategorias(['opiniao'], 3),
  ])

  const [hero, ...grid] = recentes
  const gridArticles = grid.slice(0, 12)

  return (
    <>
      {/* Hero */}
      {hero ? (
        <section className="bg-white">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <Link href={`/${hero.slug}`} className="group block">
              <div className="relative w-full aspect-[21/9] overflow-hidden rounded-xl bg-gray-200">
                {hero.featured_image_url ? (
                  <Image
                    src={hero.featured_image_url}
                    alt={hero.title}
                    fill
                    priority
                    className="object-cover"
                    sizes="100vw"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#f5821f]/30 to-[#f5821f]/10" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                  {hero.category_name && (
                    <div className="mb-3">
                      <Badge name={hero.category_name} color={hero.badge_color} size="md" />
                    </div>
                  )}
                  <h1 className="text-white font-bold text-2xl md:text-4xl leading-tight group-hover:underline line-clamp-3 max-w-3xl">
                    {hero.title}
                  </h1>
                  <div className="mt-2 flex items-center gap-3 text-white/70 text-sm">
                    {hero.author_name && <span>{hero.author_name}</span>}
                    <span>{timeAgo(hero.published_at)}</span>
                    {hero.reading_time_min && <span>· {hero.reading_time_min} min</span>}
                  </div>
                </div>
              </div>
            </Link>
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
        {/* Últimas notícias */}
        {gridArticles.length > 0 && (
          <section>
            <SectionHeader title="Últimas Notícias" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {gridArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}

        <AdUnit slot="home-leaderboard" format="leaderboard" className="flex justify-center" />

        {/* Sumaré */}
        {sumare.length > 0 && (
          <section>
            <SectionHeader title="Sumaré" href="/sp/sumare" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <ArticleCard article={sumare[0]} size="featured" />
              </div>
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {sumare.slice(1).map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Região */}
        {regiao.length > 0 && (
          <section>
            <SectionHeader title="Região Metropolitana" href="/rmc" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {regiao.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}

        {/* Brasil */}
        {brasil.length > 0 && (
          <section>
            <SectionHeader title="Brasil" href="/brasil" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {brasil.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}

        {/* Saúde */}
        {saude.length > 0 && (
          <section>
            <SectionHeader title="Saúde" href="/saude" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {saude.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}

        {/* Política */}
        {politica.length > 0 && (
          <section>
            <SectionHeader title="Política" href="/politica" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {politica.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}

        {/* Economia */}
        {economia.length > 0 && (
          <section>
            <SectionHeader title="Economia" href="/economia" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {economia.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}

        {/* Educação */}
        {educacao.length > 0 && (
          <section>
            <SectionHeader title="Educação" href="/educacao" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {educacao.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}

        {/* Cultura e Lazer */}
        {cultura.length > 0 && (
          <section>
            <SectionHeader title="Cultura e Lazer" href="/cultura-e-lazer" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {cultura.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}

        {/* Esporte */}
        {esporte.length > 0 && (
          <section>
            <SectionHeader title="Esporte" href="/esporte" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {esporte.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}

        {/* Eventos */}
        {eventos.length > 0 && (
          <section>
            <SectionHeader title="Eventos" href="/eventos" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {eventos.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}

        <AdUnit slot="home-leaderboard-2" format="leaderboard" className="flex justify-center" />

        {/* Opinião */}
        {opiniao.length > 0 && (
          <section>
            <SectionHeader title="Opinião" href="/opiniao" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {opiniao.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  )
}
