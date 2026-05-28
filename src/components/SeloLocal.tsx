import Badge from './Badge'
import type { ArticlePublico } from '@/types'

// Selo do card: jornal regional destaca a CIDADE. Matéria sem cidade
// (nacional) cai na categoria temática (fallback).
export default function SeloLocal({
  a,
}: {
  a: Pick<ArticlePublico, 'cidade_principal' | 'category_name' | 'badge_color'>
}) {
  if (a.cidade_principal) {
    return <Badge name={`📍 ${a.cidade_principal}`} color="#f5821f" size="sm" />
  }
  if (a.category_name) {
    return <Badge name={a.category_name} color={a.badge_color} size="sm" />
  }
  return null
}
