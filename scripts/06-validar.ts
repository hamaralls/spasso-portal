/**
 * Script 06 — Validação Dia 6
 *
 * Testa o portal em produção:
 *   1. 30 artigos aleatórios — HTTP 200, meta title, canonical
 *   2. 10 redirects 301 (URLs antigas WP → novas)
 *   3. Páginas fixas e categorias
 *   4. Feed RSS
 *   5. Sitemap
 *
 * Uso:
 *   npx tsx scripts/06-validar.ts [--base https://jornalspassocidades.com.br]
 *   (default: https://spasso-portal.pages.dev)
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const BASE = process.argv.find(a => a.startsWith('--base='))?.slice(7)
  ?? 'https://spasso-portal.pages.dev'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// ── Tipos ────────────────────────────────────────────────

type CheckResult = {
  url: string
  ok: boolean
  status?: number
  note?: string
}

// ── Helpers ──────────────────────────────────────────────

async function check(url: string, opts: {
  expectedStatus?: number
  expectRedirectTo?: string
  checkTitle?: boolean
  checkCanonical?: boolean
  checkMeta?: string
} = {}): Promise<CheckResult> {
  const { expectedStatus = 200, expectRedirectTo, checkTitle, checkCanonical, checkMeta } = opts

  try {
    const res = await fetch(url, {
      redirect: expectRedirectTo ? 'manual' : 'follow',
      signal: AbortSignal.timeout(15000),
      headers: { 'User-Agent': 'SpassoValidator/1.0' },
    })

    if (expectRedirectTo) {
      const loc = res.headers.get('location') ?? ''
      const statusOk = res.status === 301 || res.status === 308
      const targetOk = loc.endsWith(expectRedirectTo) || loc === expectRedirectTo
      return {
        url,
        ok: statusOk && targetOk,
        status: res.status,
        note: statusOk && targetOk
          ? `→ ${loc}`
          : `status=${res.status} location=${loc} (esperado 301→${expectRedirectTo})`,
      }
    }

    if (res.status !== expectedStatus) {
      return { url, ok: false, status: res.status, note: `esperado ${expectedStatus}` }
    }

    const html = (checkTitle || checkCanonical || checkMeta) ? await res.text() : ''

    if (checkTitle) {
      const titleMatch = html.match(/<title>([^<]*)<\/title>/i)
      if (!titleMatch?.[1]?.trim()) {
        return { url, ok: false, status: res.status, note: 'sem <title>' }
      }
    }

    if (checkCanonical) {
      const hasCanonical = /<link[^>]+rel=["']canonical["'][^>]*>/i.test(html)
      if (!hasCanonical) {
        return { url, ok: false, status: res.status, note: 'sem canonical' }
      }
    }

    if (checkMeta) {
      const hasOg = html.includes(`property="${checkMeta}"`) || html.includes(`name="${checkMeta}"`)
      if (!hasOg) {
        return { url, ok: false, status: res.status, note: `sem ${checkMeta}` }
      }
    }

    return { url, ok: true, status: res.status }
  } catch (err) {
    return { url, ok: false, note: (err as Error).message }
  }
}

function printResult(r: CheckResult, label?: string) {
  const icon = r.ok ? '✅' : '❌'
  const suffix = r.note ? ` — ${r.note}` : ''
  const lbl = label ? ` [${label}]` : ''
  console.log(`  ${icon} ${r.status ?? '---'}${lbl} ${r.url}${suffix}`)
}

// ── Main ─────────────────────────────────────────────────

async function main() {
  console.log(`\n🔍 Validando portal: ${BASE}`)
  console.log('━'.repeat(60))

  const allResults: CheckResult[] = []
  let passed = 0
  let failed = 0

  // ─── 1. Artigos aleatórios ──────────────────────────
  console.log('\n📰 Artigos aleatórios (30 posts):')

  const { data: articles } = await supabase
    .from('articles')
    .select('slug, title, category_slug')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(500)

  if (!articles?.length) {
    console.error('  Nenhum artigo encontrado no banco!')
    process.exit(1)
  }

  // Pega 30 aleatórios
  const shuffled = [...articles].sort(() => Math.random() - 0.5).slice(0, 30)

  for (const art of shuffled) {
    const url = `${BASE}/${art.slug}/`
    const r = await check(url, { checkTitle: true, checkCanonical: true })
    printResult(r, art.category_slug)
    allResults.push(r)
    if (r.ok) passed++; else failed++
    await sleep(200)
  }

  // ─── 2. Redirects 301 ──────────────────────────────
  console.log('\n↪️  Redirects 301 (categorias WP):')

  const redirectTests = [
    { from: '/category/sumare/',          to: '/sp/sumare/' },
    { from: '/category/hortolandia/',     to: '/sp/hortolandia/' },
    { from: '/category/nova-odessa/',     to: '/sp/nova-odessa/' },
    { from: '/category/campinas/',        to: '/sp/campinas/' },
    { from: '/category/saude/',           to: '/saude/' },
    { from: '/category/politica/',        to: '/politica/' },
    { from: '/category/politicando/',     to: '/opiniao/' },
    { from: '/category/brasil/',          to: '/brasil/' },
    { from: '/category/featured/',        to: '/' },
    { from: '/feed/',                     to: '/feed.xml' },
  ]

  for (const { from, to } of redirectTests) {
    const url = `${BASE}${from}`
    const r = await check(url, { expectRedirectTo: to })
    printResult(r, from)
    allResults.push(r)
    if (r.ok) passed++; else failed++
    await sleep(150)
  }

  // ─── 3. Páginas de categoria ────────────────────────
  console.log('\n📂 Páginas de categoria:')

  const catPages = [
    '/sp/sumare/',
    '/sp/hortolandia/',
    '/rmc/',
    '/brasil/',
    '/saude/',
    '/politica/',
    '/opiniao/',
    '/eventos/',
    '/tecnologia/',
  ]

  for (const page of catPages) {
    const url = `${BASE}${page}`
    const r = await check(url, { checkTitle: true })
    printResult(r)
    allResults.push(r)
    if (r.ok) passed++; else failed++
    await sleep(200)
  }

  // ─── 4. Páginas fixas ───────────────────────────────
  console.log('\n📄 Páginas fixas:')

  const staticPages = [
    { path: '/',                label: 'Home' },
    { path: '/sobre/',          label: 'Sobre' },
    { path: '/contato/',        label: 'Contato' },
    { path: '/privacidade/',    label: 'Privacidade' },
    { path: '/anuncie/',        label: 'Anuncie' },
    { path: '/edicao-impressa/', label: 'Ed. Impressa' },
  ]

  for (const { path, label } of staticPages) {
    const url = `${BASE}${path}`
    const r = await check(url, { checkTitle: true })
    printResult(r, label)
    allResults.push(r)
    if (r.ok) passed++; else failed++
    await sleep(150)
  }

  // ─── 5. SEO crítico ─────────────────────────────────
  console.log('\n🔍 SEO (home):')

  const seoChecks = [
    { url: `${BASE}/`,         meta: 'og:title',       label: 'og:title' },
    { url: `${BASE}/`,         meta: 'og:image',       label: 'og:image' },
    { url: `${BASE}/`,         meta: 'description',    label: 'meta description' },
    { url: `${BASE}/sitemap.xml`, meta: undefined,     label: 'sitemap.xml' },
    { url: `${BASE}/robots.txt`, meta: undefined,      label: 'robots.txt' },
    { url: `${BASE}/feed.xml`,   meta: undefined,      label: 'feed.xml' },
  ]

  for (const { url, meta, label } of seoChecks) {
    const r = meta
      ? await check(url, { checkMeta: meta })
      : await check(url, { expectedStatus: 200 })
    printResult(r, label)
    allResults.push(r)
    if (r.ok) passed++; else failed++
    await sleep(150)
  }

  // ─── Resumo ─────────────────────────────────────────
  console.log('\n' + '━'.repeat(60))
  console.log(`\n📊 RESULTADO FINAL: ${passed} ✅  ${failed} ❌  (total ${allResults.length})`)

  const score = Math.round((passed / allResults.length) * 100)
  console.log(`   Score: ${score}%`)

  if (score >= 95) {
    console.log('\n🚀 Portal pronto para go-live!')
  } else if (score >= 80) {
    console.log('\n⚠️  Alguns itens precisam de atenção antes do go-live.')
  } else {
    console.log('\n❌  Muitos itens falharam — investigar antes de prosseguir.')
  }

  if (failed > 0) {
    console.log('\nItens que falharam:')
    allResults.filter(r => !r.ok).forEach(r => {
      console.log(`  ❌ ${r.url}${r.note ? ' — ' + r.note : ''}`)
    })
  }

  console.log()
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

main().catch(err => {
  console.error('Erro fatal:', err)
  process.exit(1)
})
