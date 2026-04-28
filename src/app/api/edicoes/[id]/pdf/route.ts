import { getEdicaoPorId } from '@/lib/supabase/queries'

export const runtime = 'edge'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ed = await getEdicaoPorId(id)
  if (!ed) return new Response('Não encontrado', { status: 404 })

  const res = await fetch(ed.pdf_url)
  if (!res.ok) return new Response('Erro ao buscar PDF', { status: 502 })

  const filename = ed.edition_number
    ? `Spasso-Cidades-Edicao-${ed.edition_number}.pdf`
    : `Spasso-Cidades-${ed.published_date}.pdf`

  return new Response(res.body, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
