/**
 * Diagnóstico 8: investiga padrões nos posts e imagens de 2026
 * Busca evidências de corrupção: thumbIds duplicados, datas incompatíveis,
 * saltos na numeração das fotos.
 */
import fs from 'node:fs'
import path from 'node:path'
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const DATA_DIR = path.join(__dirname, 'data')
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)
const WP_UPLOADS = 'https://jornalspassocidades.com.br/wp-content/uploads/'

async function main() {
  const postmeta    = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'postmeta.json'), 'utf8'))
  const attachments = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'attachments.json'), 'utf8'))
  const posts       = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'posts.json'), 'utf8'))

  // Monta mapa completo slug → { thumbId, wpUrl, postDate }
  type PostInfo = { slug: string; postDate: string; thumbId: string; wpUrl: string; imgMonth: string }
  const postInfos: PostInfo[] = []

  for (const post of posts) {
    const year = post.post_date?.slice(0, 4)
    if (year !== '2026') continue

    const meta    = postmeta[post.ID] ?? postmeta[String(post.ID)]
    const thumbId = meta?.['_thumbnail_id']
    if (!thumbId) continue

    const wpUrl   = attachments[thumbId] ?? ''
    const imgMonth = wpUrl.match(/uploads\/(\d{4}\/\d{2})\//)?.[1] ?? 'desconhecido'

    postInfos.push({
      slug:      post.post_name,
      postDate:  post.post_date?.slice(0, 7),
      thumbId,
      wpUrl,
      imgMonth,
    })
  }

  postInfos.sort((a, b) => a.postDate.localeCompare(b.postDate))

  console.log(`\n${postInfos.length} posts de 2026 com thumbnail no WP dump\n`)

  // 1. Thumbs duplicados em 2026 (mesmo attachment em 2+ posts)
  const thumbCount: Record<string, number> = {}
  for (const p of postInfos) thumbCount[p.thumbId] = (thumbCount[p.thumbId] ?? 0) + 1
  const duplicados = Object.entries(thumbCount).filter(([, c]) => c > 1)
  console.log(`── Thumbnails duplicados em posts 2026: ${duplicados.length}`)
  duplicados.sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([id, c]) => {
    const url = attachments[id] ?? '?'
    console.log(`  ${c}x  thumbId=${id}  ${url.replace(WP_UPLOADS, '')}`)
  })

  // 2. Imagens de outro ano/mês usadas em posts 2026
  const imgMesErrado = postInfos.filter(p => !p.imgMonth.startsWith('2026') && !p.imgMonth.startsWith('2025'))
  console.log(`\n── Posts 2026 com imagem de outra época (< 2025): ${imgMesErrado.length}`)
  imgMesErrado.slice(0, 10).forEach(p =>
    console.log(`  post ${p.postDate}  img ${p.imgMonth}  ${p.slug}`)
  )

  // 3. Padrão de numeração: Foto-Portal-SPASSO-cidades-*.jpg em 2026
  const fotosSpasso = postInfos.filter(p => p.wpUrl.includes('Foto-Portal-SPASSO-cidades'))
  console.log(`\n── Posts 2026 usando Foto-Portal-SPASSO-cidades-*.jpg: ${fotosSpasso.length}`)

  // Extrai número da foto e ordena por data do post
  const numerados = fotosSpasso
    .map(p => {
      const m = p.wpUrl.match(/Foto-Portal-SPASSO-cidades-(\d+(?:-\d+)*)\.jpg/)
      const num = m?.[1] ?? '?'
      return { ...p, num }
    })
    .sort((a, b) => a.postDate.localeCompare(b.postDate))

  console.log('  (post_date → num da foto — sequência esperada = crescente)')
  numerados.slice(0, 30).forEach(p =>
    console.log(`  ${p.postDate}  foto-${p.num.padEnd(8)}  ${p.slug}`)
  )

  // Verifica se a numeração é monótona (indicador de ordem correta)
  const nums = numerados.map(p => {
    const parts = p.num.split('-').map(Number)
    return parts[0] * 100 + (parts[1] ?? 0)
  }).filter(n => !isNaN(n))

  let inversoes = 0
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] < nums[i - 1]) inversoes++
  }
  console.log(`\n  Inversões de ordem na numeração: ${inversoes} de ${nums.length - 1} transições`)
  console.log(`  (0 inversões = fotos perfeitamente em ordem com os posts)`)
  console.log(`  (muitas inversões = fotos embaralhadas nos posts)`)

  // 4. Distribuição de mês da imagem vs mês do post
  console.log('\n── Mês da imagem vs mês do post (2026):')
  const mesComp: Record<string, number> = {}
  for (const p of postInfos) {
    const key = `post ${p.postDate} → img ${p.imgMonth}`
    mesComp[key] = (mesComp[key] ?? 0) + 1
  }
  Object.entries(mesComp).sort().forEach(([k, c]) => console.log(`  ${c}x  ${k}`))
}

main().catch(console.error)
