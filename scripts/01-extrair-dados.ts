/**
 * Script 01 — Extrai dados relevantes do dump SQL do WordPress
 * Gera arquivos JSON intermediários em scripts/data/
 *
 * Uso: npx tsx scripts/01-extrair-dados.ts
 *
 * Gera:
 *   scripts/data/posts.json          — posts publicados (wp_posts type=post status=publish)
 *   scripts/data/attachments.json    — posts type=attachment (mapa ID→guid)
 *   scripts/data/postmeta.json       — metadados relevantes por post_id
 *   scripts/data/terms.json          — mapa term_id → {name, slug}
 *   scripts/data/term_taxonomy.json  — mapa term_taxonomy_id → {term_id, taxonomy, parent}
 *   scripts/data/term_relationships.json — mapa post_id → [term_taxonomy_ids]
 */

import fs from 'node:fs'
import path from 'node:path'
import { parseDump, type Row } from './lib/sql-parser.js'

const DUMP_PATH = '/home/amaral/Área /u217375797_YdnfK.sql'
const DATA_DIR  = path.join(__dirname, 'data')

// Postmeta keys que interessam
const META_KEYS = new Set([
  '_thumbnail_id',
  '_yoast_wpseo_title',
  '_yoast_wpseo_metadesc',
  '_aioseo_title',
  '_aioseo_description',
])

const TABLES = [
  'wp_posts',
  'wp_postmeta',
  'wp_terms',
  'wp_term_taxonomy',
  'wp_term_relationships',
]

// ── Estruturas de dados ─────────────────────────────────

type WPPost = {
  ID: string
  post_title: string
  post_name: string    // slug
  post_content: string
  post_excerpt: string
  post_date: string
  post_author: string
  post_status: string
  post_type: string
}

const posts: WPPost[]       = []
const attachments: Record<string, string> = {}  // ID → guid (URL)
const postmeta: Record<string, Record<string, string>> = {}
const terms: Record<string, { name: string; slug: string }> = {}
const termTaxonomy: Record<string, { term_id: string; taxonomy: string; parent: string }> = {}
const termRelationships: Record<string, string[]> = {}  // post_id → [term_taxonomy_ids]

let totalRows = 0
let totalPosts = 0
let totalAttachments = 0
let totalMeta = 0

// ── Handler de cada linha ────────────────────────────────

function handleRow(table: string, row: Row) {
  totalRows++

  switch (table) {
    case 'wp_posts': {
      const type   = row.post_type   ?? ''
      const status = row.post_status ?? ''

      if (type === 'post' && status === 'publish') {
        posts.push({
          ID:           row.ID           ?? '',
          post_title:   row.post_title   ?? '',
          post_name:    row.post_name    ?? '',
          post_content: row.post_content ?? '',
          post_excerpt: row.post_excerpt ?? '',
          post_date:    row.post_date    ?? '',
          post_author:  row.post_author  ?? '',
          post_status:  status,
          post_type:    type,
        })
        totalPosts++
      }

      if (type === 'attachment' && row.guid) {
        attachments[row.ID!] = row.guid
        totalAttachments++
      }
      break
    }

    case 'wp_postmeta': {
      const key = row.meta_key ?? ''
      if (META_KEYS.has(key)) {
        const pid = row.post_id ?? ''
        if (!postmeta[pid]) postmeta[pid] = {}
        postmeta[pid][key] = row.meta_value ?? ''
        totalMeta++
      }
      break
    }

    case 'wp_terms': {
      const id = row.term_id ?? ''
      terms[id] = { name: row.name ?? '', slug: row.slug ?? '' }
      break
    }

    case 'wp_term_taxonomy': {
      const id = row.term_taxonomy_id ?? ''
      termTaxonomy[id] = {
        term_id:  row.term_id  ?? '',
        taxonomy: row.taxonomy ?? '',
        parent:   row.parent   ?? '0',
      }
      break
    }

    case 'wp_term_relationships': {
      const pid  = row.object_id        ?? ''
      const ttid = row.term_taxonomy_id ?? ''
      if (!termRelationships[pid]) termRelationships[pid] = []
      termRelationships[pid].push(ttid)
      break
    }
  }
}

// ── Main ─────────────────────────────────────────────────

async function main() {
  if (!fs.existsSync(DUMP_PATH)) {
    console.error(`Dump não encontrado: ${DUMP_PATH}`)
    process.exit(1)
  }

  fs.mkdirSync(DATA_DIR, { recursive: true })

  console.log('Lendo dump SQL...')
  console.log(`Arquivo: ${DUMP_PATH}`)
  console.log('(pode levar 1-2 minutos para 126MB)\n')

  const start = Date.now()

  await parseDump(DUMP_PATH, {
    tables: TABLES,
    onRow: handleRow,
    onProgress: (lines) => {
      process.stdout.write(`\r  ${(lines / 1000).toFixed(0)}k linhas lidas...`)
    },
  })

  const elapsed = ((Date.now() - start) / 1000).toFixed(1)
  console.log(`\n\nDump lido em ${elapsed}s`)
  console.log(`  Posts publicados:  ${totalPosts}`)
  console.log(`  Attachments:       ${totalAttachments}`)
  console.log(`  Postmeta entries:  ${totalMeta}`)
  console.log(`  Terms:             ${Object.keys(terms).length}`)
  console.log(`  Term taxonomies:   ${Object.keys(termTaxonomy).length}`)
  console.log(`  Term relationships: ${Object.keys(termRelationships).length}`)

  // Salva JSONs
  console.log('\nSalvando dados...')

  fs.writeFileSync(path.join(DATA_DIR, 'posts.json'),
    JSON.stringify(posts, null, 0))

  fs.writeFileSync(path.join(DATA_DIR, 'attachments.json'),
    JSON.stringify(attachments, null, 0))

  fs.writeFileSync(path.join(DATA_DIR, 'postmeta.json'),
    JSON.stringify(postmeta, null, 0))

  fs.writeFileSync(path.join(DATA_DIR, 'terms.json'),
    JSON.stringify(terms, null, 0))

  fs.writeFileSync(path.join(DATA_DIR, 'term_taxonomy.json'),
    JSON.stringify(termTaxonomy, null, 0))

  fs.writeFileSync(path.join(DATA_DIR, 'term_relationships.json'),
    JSON.stringify(termRelationships, null, 0))

  console.log(`Dados salvos em ${DATA_DIR}/`)

  // Mostra amostra de categorias para verificação
  console.log('\nAmostra de categorias encontradas:')
  const catTerms = Object.entries(termTaxonomy)
    .filter(([, tt]) => tt.taxonomy === 'category')
    .slice(0, 20)
    .map(([ttid, tt]) => {
      const term = terms[tt.term_id]
      return `  ${term?.slug} (id=${tt.term_id}, ttid=${ttid})`
    })
  catTerms.forEach(l => console.log(l))

  console.log('\n✅ Script 01 concluído. Agora rode: npx tsx scripts/02-migrar-posts.ts')
}

main().catch(err => {
  console.error('Erro:', err)
  process.exit(1)
})
