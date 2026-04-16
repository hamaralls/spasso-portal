/**
 * Parser para dumps phpMyAdmin (MySQL/MariaDB)
 * Formato: INSERT INTO `table` (...cols...) VALUES\n(row1),\n(row2);\n
 * Cada linha de dados começa com ( e termina com , ou );
 */

import fs from 'node:fs'
import readline from 'node:readline'

export type Row = Record<string, string | null>

/** Converte string MySQL-escaped para string JS */
export function unescapeMySQL(s: string): string {
  return s
    .replace(/\\0/g, '\0')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\Z/g, '\x1a')
    .replace(/\\\\/g, '\\')
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
}

/**
 * Faz parse de uma tupla MySQL: "(val1, 'val2', NULL, 123)"
 * Retorna array de valores (null para NULL)
 */
function parseTuple(s: string): Array<string | null> {
  const result: Array<string | null> = []
  // remove parênteses externos e whitespace
  const inner = s.trim().replace(/^[\(]/, '').replace(/[\)][,;]?\s*$/, '')
  let i = 0

  while (i <= inner.length) {
    // pula whitespace
    while (i < inner.length && (inner[i] === ' ' || inner[i] === '\t')) i++
    if (i >= inner.length) break

    if (inner[i] === "'") {
      // string delimitada por aspas simples
      let val = ''
      i++ // pula '
      while (i < inner.length) {
        if (inner[i] === '\\') {
          val += inner[i] + inner[i + 1]
          i += 2
        } else if (inner[i] === "'") {
          i++ // fecha '
          break
        } else {
          val += inner[i]
          i++
        }
      }
      result.push(unescapeMySQL(val))
    } else if (inner.slice(i, i + 4).toUpperCase() === 'NULL') {
      result.push(null)
      i += 4
    } else {
      // número ou literal
      let val = ''
      while (i < inner.length && inner[i] !== ',') {
        val += inner[i]
        i++
      }
      result.push(val.trim() || null)
    }

    // pula vírgula separadora entre campos
    if (i < inner.length && inner[i] === ',') i++
  }

  return result
}

/**
 * Extrai nomes de colunas de uma linha INSERT:
 * INSERT INTO `table` (`col1`, `col2`, ...) VALUES
 */
function extractColumns(line: string): string[] {
  const m = line.match(/INSERT INTO `[^`]+`\s*\(([^)]+)\)/i)
  if (!m) return []
  return m[1].split(',').map(c => c.trim().replace(/`/g, ''))
}

export interface ParseOptions {
  tables: string[]                           // tabelas a extrair
  onRow: (table: string, row: Row) => void   // callback por linha
  onProgress?: (linesRead: number) => void
}

/**
 * Faz parse streaming do dump SQL.
 * Chama onRow para cada linha das tabelas especificadas.
 *
 * Formato esperado (phpMyAdmin extendido):
 *   INSERT INTO `table` (`col1`,`col2`) VALUES
 *   (v1,v2),
 *   (v3,v4);
 */
export async function parseDump(filePath: string, opts: ParseOptions): Promise<void> {
  const { tables, onRow, onProgress } = opts

  const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' })
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity })

  let currentTable: string | null = null
  let currentColumns: string[] = []
  let linesRead = 0

  for await (const rawLine of rl) {
    linesRead++
    if (onProgress && linesRead % 50000 === 0) onProgress(linesRead)

    const line = rawLine.trimEnd()
    if (!line || line.startsWith('--') || line.startsWith('/*') || line.startsWith('/*!')) continue

    // ── Linha de INSERT (cabeçalho) ─────────────────────
    if (line.startsWith('INSERT INTO `')) {
      const tblMatch = line.match(/^INSERT INTO `([^`]+)`/)
      if (!tblMatch) continue

      const tbl = tblMatch[1]
      if (!tables.includes(tbl)) {
        currentTable = null
        continue
      }

      currentTable = tbl
      currentColumns = extractColumns(line)

      // INSERT completo em uma linha: INSERT INTO ... VALUES (v1,...),(v2,...);
      if (line.includes(') VALUES (') || line.includes(') VALUES(')) {
        const valIdx = line.search(/VALUES\s*\(/i)
        const valPart = line.slice(valIdx + 6).trimStart() // pula 'VALUES'
        parseTupleBlock(valPart, currentColumns, currentTable, onRow)
        // Se termina com ; significa bloco completo, mas pode vir mais linhas
        // Deixa currentTable ativo para capturar linhas de dados se houver
        if (line.endsWith(';')) currentTable = null
      }
      // Se a linha termina só com "VALUES" ou "VALUES\n", aguarda linhas de dados
      continue
    }

    // ── Linha de dados (tupla) ──────────────────────────
    if (currentTable && line.startsWith('(')) {
      const trimmed = line.trimStart()
      const cols = currentColumns

      // uma linha pode ter múltiplas tuplas separadas por ),(
      parseTupleBlock(trimmed, cols, currentTable, onRow)

      // fim do bloco INSERT
      if (trimmed.endsWith(';') || trimmed.endsWith(');')) {
        currentTable = null
      }
      continue
    }

    // Se encontramos uma linha que não começa com ( e estamos em modo ativo,
    // pode ser fim do bloco (linha de CREATE TABLE, etc.)
    if (currentTable && !line.startsWith('(') && !line.startsWith(' ') && line.length > 0) {
      currentTable = null
    }
  }
}

/**
 * Faz parse de um bloco de tuplas: "(v1,v2),(v3,v4);" ou "(v1,v2),"
 */
function parseTupleBlock(
  block: string,
  columns: string[],
  table: string,
  onRow: (table: string, row: Row) => void
): void {
  // Divide em tuplas individuais respeitando strings
  let depth = 0
  let inStr = false
  let start = -1

  for (let i = 0; i < block.length; i++) {
    const c = block[i]

    if (c === '\\' && inStr) { i++; continue }
    if (c === "'") { inStr = !inStr; continue }
    if (inStr) continue

    if (c === '(') {
      if (depth === 0) start = i
      depth++
    } else if (c === ')') {
      depth--
      if (depth === 0 && start >= 0) {
        const tuple = block.slice(start, i + 1)
        const vals = parseTuple(tuple)
        const row: Row = {}
        columns.forEach((col, idx) => {
          row[col] = vals[idx] ?? null
        })
        onRow(table, row)
        start = -1
      }
    }
  }
}
