import Link from 'next/link'
import Image from 'next/image'
import SeloLocal from '@/components/SeloLocal'
import ArticleCard from '@/components/ArticleCard'
import SectionHeader from '@/components/SectionHeader'
import { AdUnit } from '@/components/AdUnit'
import EdicaoSemanalWidget from '@/components/EdicaoSemanalWidget'
import {
  getArtigosHero,
  getArtigosRecentes,
  getArtigosPorCategorias,
  getArtigosPorTema,
  getColunistas,
  getUltimaEdicao,
  getHomeSections,
  type HomeSectionConfig,
} from '@/lib/supabase/queries'
import type { ArticlePublico } from '@/types'

export const runtime = 'edge'
export const revalidate = 120

function MetropolesGrid({ articles }: { articles: ArticlePublico[] }) {
  const a = articles
  if (a.length === 0) return null
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-6 gap-y-4 items-start">
        <div className="lg:col-span-2">
          <Link href={`/${a[0].slug}`} className="group flex gap-4">
            <ArticleThumb article={a[0]} sizes="(max-width: 1024px) 50vw, 28vw" />
            <div className="flex-1 min-w-0 flex flex-col justify-start pt-1">
              <SeloLocal a={a[0]} />
              <h3 className="text-xl font-bold leading-snug mt-1 group-hover:underline line-clamp-4 text-[#1a1a1a]">
                {a[0].title}
              </h3>
              {a[0].excerpt && (
                <p className="text-sm text-gray-500 mt-2 line-clamp-3 leading-relaxed">
                  {strip(a[0].excerpt)}
                </p>
              )}
            </div>
          </Link>
        </div>
        <div className="hidden lg:flex flex-col gap-4">
          {a.slice(1, 3).map((art) => (
            <ArticleCard key={art.id} article={art} size="compact" />
          ))}
        </div>
      </div>
      {a.length > 3 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {a.slice(3).map((art) => (
            <ArticleCard key={art.id} article={art} size="compact" />
          ))}
        </div>
      )}
    </div>
  )
}

function ArticleThumb({ article, sizes }: { article: ArticlePublico; sizes: string }) {
  return (
    <div className="relative w-[48%] aspect-[4/3] shrink-0 overflow-hidden bg-gray-200">
      {article.featured_image_url ? (
        <Image
          src={article.featured_image_url}
          alt={article.title}
          fill
          className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
          sizes={sizes}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200" />
      )}
    </div>
  )
}

async function loadSectionArticles(section: HomeSectionConfig): Promise<ArticlePublico[]> {
  const limit = Math.max(1, section.article_count + 4)
  if (section.slug === 'ultimas' || !section.category_slugs?.length) {
    return getArtigosRecentes(limit)
  }
  if (section.category_slugs.length === 1) {
    return getArtigosPorTema(section.category_slugs[0], limit)
  }
  return getArtigosPorCategorias(section.category_slugs, limit)
}

export default async function Home() {
  const [hero, homeSections, colunistas, ultimaEdicao] = await Promise.all([
    getArtigosHero(),
    getHomeSections(),
    getColunistas(),
    getUltimaEdicao(),
  ])

  const heroIds = new Set(hero.map((a) => a.id))
  const sectionData = await Promise.all(
    homeSections.map(async (section) => ({
      section,
      articles: (await loadSectionArticles(section))
        .filter((article) => !heroIds.has(article.id))
        .slice(0, section.article_count),
    })),
  )

  return (
    <>
      <Hero articles={hero} />
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        {(() => {
          let usedSidebarFallback = false
          return sectionData.map(({ section, articles }) => {
            const allowSidebarFallback = section.layout === 'metropoles-sidebar'
              && section.show_banner
              && !usedSidebarFallback
            if (allowSidebarFallback) usedSidebarFallback = true

            return (
              <HomeSection
                key={section.slug}
                section={section}
                articles={articles}
                colunistas={colunistas}
                ultimaEdicao={ultimaEdicao}
                allowSidebarFallback={allowSidebarFallback}
              />
            )
          })
        })()}
      </div>
    </>
  )
}

function Hero({ articles }: { articles: ArticlePublico[] }) {
  if (articles.length < 2) {
    return (
      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400">
          <p className="text-lg">Portal em preparacao. Noticias em breve!</p>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-5">
          <Link href={`/${articles[0].slug}`} className="group lg:col-span-3 flex flex-col sm:flex-row gap-6">
            <div className="sm:w-[55%] relative aspect-video overflow-hidden bg-gray-200 shrink-0">
              {articles[0].featured_image_url && (
                <Image
                  src={articles[0].featured_image_url}
                  alt={articles[0].title}
                  fill
                  priority
                  className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  sizes="(max-width: 640px) 100vw, 60vw"
                />
              )}
            </div>
            <div className="sm:w-[45%] flex flex-col justify-start pt-1">
              <SeloLocal a={articles[0]} />
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold leading-tight mt-2 group-hover:underline line-clamp-5 text-[#1a1a1a]">
                {articles[0].title}
              </h1>
              {articles[0].excerpt && (
                <p className="text-sm text-gray-500 mt-2 line-clamp-3 leading-relaxed">
                  {strip(articles[0].excerpt)}
                </p>
              )}
              {articles[0].author_name && (
                <p className="mt-auto pt-3 text-xs text-gray-400">{articles[0].author_name}</p>
              )}
            </div>
          </Link>

          <div className="flex flex-col gap-4 justify-between h-full">
            {articles.slice(1, 4).map((article) => (
              <Link key={article.id} href={`/${article.slug}`} className="group flex items-start gap-3">
                <div className="relative w-24 h-24 shrink-0 overflow-hidden bg-gray-200">
                  {article.featured_image_url ? (
                    <Image
                      src={article.featured_image_url}
                      alt={article.title}
                      fill
                      className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      sizes="96px"
                    />
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
  )
}

function HomeSection({
  section,
  articles,
  colunistas,
  ultimaEdicao,
  allowSidebarFallback,
}: {
  section: HomeSectionConfig
  articles: ArticlePublico[]
  colunistas: Awaited<ReturnType<typeof getColunistas>>
  ultimaEdicao: Awaited<ReturnType<typeof getUltimaEdicao>>
  allowSidebarFallback: boolean
}) {
  if (section.layout === 'columnists') {
    return (
      <>
        {colunistas.length > 0 && (
          <section>
            <SectionHeader title={section.title} href={section.href ?? '/colunistas'} color={section.color ?? '#f5821f'} titleColor={section.color ?? '#f5821f'} linkColor={section.color ?? '#f5821f'} />
            <div className={`grid gap-4 ${
              colunistas.length === 1 ? 'grid-cols-1 max-w-sm' :
              colunistas.length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl' :
              'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            }`}>
              {colunistas.map((col) => (
                <ColumnistCard key={col.id} col={col} />
              ))}
            </div>
          </section>
        )}
        <SocialAndAd
          slot={section.banner_slot ?? 'home-leaderboard'}
          showAd={section.show_banner}
          fallbackSlot="middle"
        />
      </>
    )
  }

  if (articles.length === 0) return null

  const header = (
    <SectionHeader
      title={section.title}
      href={section.href ?? undefined}
      color={section.color ?? '#f5821f'}
    />
  )

  if (section.layout === 'metropoles-sidebar') {
    return (
      <section>
        {header}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
          <div className="lg:col-span-3">
            <MetropolesGrid articles={articles} />
          </div>
          <aside className="hidden lg:flex flex-col gap-4">
            {section.slug === 'rmc' && ultimaEdicao && <EdicaoSemanalWidget edition={ultimaEdicao} />}
            {section.show_banner && section.banner_slot && (
              <AdUnit
                slot={section.banner_slot}
                format="rectangle"
                fallbackSlot={allowSidebarFallback ? 'sidebar' : undefined}
                houseAd
              />
            )}
          </aside>
        </div>
      </section>
    )
  }

  if (section.layout === 'two-up') {
    return (
      <section>
        {header}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {articles.map((art) => (
            <Link key={art.id} href={`/${art.slug}`} className="group flex gap-4">
              <ArticleThumb article={art} sizes="(max-width: 1024px) 50vw, 25vw" />
              <div className="flex-1 min-w-0 flex flex-col justify-start pt-1">
                <SeloLocal a={art} />
                <h3 className="text-xl font-bold leading-snug mt-1 group-hover:underline line-clamp-4 text-[#1a1a1a]">
                  {art.title}
                </h3>
                {art.excerpt && (
                  <p className="text-sm text-gray-500 mt-2 line-clamp-3 leading-relaxed">
                    {strip(art.excerpt)}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>
    )
  }

  if (section.layout === 'cards') {
    return (
      <section>
        {header}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      </section>
    )
  }

  return (
    <>
      <section>
        {header}
        <MetropolesGrid articles={articles} />
      </section>
      {section.show_banner && section.banner_slot && (
        <div className="flex justify-center py-2">
          <AdUnit slot={section.banner_slot} format="leaderboard" houseAd />
        </div>
      )}
    </>
  )
}

function ColumnistCard({ col }: { col: Awaited<ReturnType<typeof getColunistas>>[number] }) {
  const initials = col.name.split(' ').filter(Boolean)
    .map((n) => n[0].toUpperCase()).slice(0, 2).join('')
  const href = `/colunistas/${col.slug}`
  return (
    <Link href={href} className="group flex items-start gap-3 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 flex items-center justify-center" style={{ background: col.avatar_url ? undefined : '#f5821f1a' }}>
        {col.avatar_url ? (
          <Image src={col.avatar_url} alt={col.name} width={48} height={48} className="object-cover w-full h-full" />
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
            <p className="text-sm font-semibold text-[#1a1a1a] leading-snug line-clamp-2 group-hover:underline">
              {col.lastArticle.title}
            </p>
            {col.lastArticle.excerpt && (
              <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mt-0.5">
                {strip(col.lastArticle.excerpt)}
              </p>
            )}
          </>
        )}
      </div>
    </Link>
  )
}

function SocialAndAd({ slot, showAd, fallbackSlot }: { slot: string; showAd: boolean; fallbackSlot?: string }) {
  return (
    <div className="flex flex-col xl:flex-row items-center justify-center gap-8 py-4">
      {showAd && (
        <div className="flex justify-center shrink-0">
          <AdUnit slot={slot} format="leaderboard" fallbackSlot={fallbackSlot} houseAd />
        </div>
      )}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <span className="text-sm font-semibold text-gray-400">Siga o Spasso Cidades:</span>
        <div className="flex gap-3">
          <a href="https://www.facebook.com/jornalspassocidades" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1877F2] text-white text-sm font-semibold hover:bg-[#0d6de0] transition-colors">
            Facebook
          </a>
          <a href="https://www.instagram.com/spassocidades" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-semibold hover:opacity-90 transition-opacity" style={{ background: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }}>
            Instagram
          </a>
        </div>
      </div>
    </div>
  )
}

function strip(value: string): string {
  return value.replace(/<[^>]+>/g, '')
}
