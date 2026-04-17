/**
 * Diagnóstico 9: compara padrão de numeração 2024 vs 2025 vs 2026
 * para ver se o nível de "inversão" de 2026 é anormal
 */
import fs from 'node:fs'
import path from 'node:path'

const DATA_DIR = path.join(__dirname, 'data')
const WP_UPLOADS = 'https://jornalspassocidades.com.br/wp-content/uploads/'

function analisaAno(posts: any[], postmeta: any, attachments: any, ano: string) {
  const infos = posts
    .filter(p => p.post_date?.startsWith(ano))
    .map(p => {
      const meta    = postmeta[p.ID] ?? postmeta[String(p.ID)]
      const thumbId = meta?.['_thumbnail_id']
      const wpUrl   = thumbId ? (attachments[thumbId] ?? '') : ''
      const m       = wpUrl.match(/Foto-Portal-SPASSO-cidades-(\d+(?:-\d+)*)\.jpg/)
      const num     = m ? m[1].split('-').map(Number).reduce((a, b, i) => a + b * Math.pow(100, -i)) : null
      return { slug: p.post_name, date: p.post_date?.slice(0, 10), num, wpUrl }
    })
    .filter(p => p.num !== null)
    .sort((a, b) => a.date.localeCompare(b.date))

  const nums = infos.map(p => p.num!)
  let inversoes = 0
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] < nums[i - 1]) inversoes++
  }
  const pct = nums.length > 1 ? ((inversoes / (nums.length - 1)) * 100).toFixed(0) : '0'

  // Thumbs duplicados excluindo Politicando
  const thumbCount: Record<string, number> = {}
  posts.filter(p => p.post_date?.startsWith(ano)).forEach(p => {
    const meta    = postmeta[p.ID] ?? postmeta[String(p.ID)]
    const thumbId = meta?.['_thumbnail_id']
    if (!thumbId) return
    const url = attachments[thumbId] ?? ''
    if (url.includes('foto-jodrther')) return // exclui Politicando
    thumbCount[thumbId] = (thumbCount[thumbId] ?? 0) + 1
  })
  const dupsFora = Object.values(thumbCount).filter(c => c > 1).length

  return { ano, total: infos.length, inversoes, pct, dupsFora }
}

async function main() {
  const postmeta    = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'postmeta.json'), 'utf8'))
  const attachments = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'attachments.json'), 'utf8'))
  const posts       = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'posts.json'), 'utf8'))

  console.log('── Comparação de padrão por ano ─────────────────────────')
  console.log('   Inversões = % de fotos fora de ordem cronológica com os posts')
  console.log('   Dups fora = thumbnails duplicados excluindo Politicando\n')
  console.log('   ano   fotos  inversões  dups-fora')

  for (const ano of ['2024', '2025', '2026']) {
    const r = analisaAno(posts, postmeta, attachments, ano)
    console.log(`   ${r.ano}  ${String(r.total).padEnd(5)}  ${String(r.pct + '%').padEnd(9)}  ${r.dupsFora}`)
  }

  console.log('\n── Análise: thumbIds idênticos entre ANOS diferentes ──────')
  // Verifica se algum thumbId de 2024 é usado em 2026 (cross-year pollution)
  const thumbPorAno: Record<string, Set<string>> = {}
  for (const post of posts) {
    const ano     = post.post_date?.slice(0, 4)
    const meta    = postmeta[post.ID] ?? postmeta[String(post.ID)]
    const thumbId = meta?.['_thumbnail_id']
    if (!thumbId || !ano) continue
    if (!thumbPorAno[ano]) thumbPorAno[ano] = new Set()
    thumbPorAno[ano].add(thumbId)
  }

  const anos = ['2024', '2025', '2026']
  for (let i = 0; i < anos.length; i++) {
    for (let j = i + 1; j < anos.length; j++) {
      const a = thumbPorAno[anos[i]] ?? new Set()
      const b = thumbPorAno[anos[j]] ?? new Set()
      const shared = [...a].filter(id => {
        if (!b.has(id)) return false
        const url = attachments[id] ?? ''
        return !url.includes('foto-jodrther') // exclui Politicando
      })
      console.log(`  ${anos[i]} ↔ ${anos[j]}: ${shared.length} thumbIds em comum (excl. Politicando)`)
      shared.slice(0, 3).forEach(id =>
        console.log(`    thumbId ${id}: ${(attachments[id] ?? '').replace(WP_UPLOADS, '')}`)
      )
    }
  }
}

main().catch(console.error)
