import { getSupabase } from '@/lib/supabase/edge'

export const runtime = 'edge'

function normalizeSlot(value: string | null): string {
  const slot = (value ?? '').toLowerCase()
  if (slot.includes('sidebar')) return 'sidebar'
  if (slot.includes('below') || slot.includes('article')) return 'below_article'
  if (slot.includes('footer')) return 'footer'
  if (slot.includes('top') || slot.includes('leaderboard')) return 'top'
  return 'middle'
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const slot = normalizeSlot(url.searchParams.get('slot'))
  const now = new Date().toISOString()

  const { data, error } = await getSupabase()
    .from('house_ads')
    .select('id, name, image_url, link_url, slot')
    .eq('active', true)
    .eq('slot', slot)
    .lte('starts_at', now)
    .or(`ends_at.is.null,ends_at.gt.${now}`)
    .order('starts_at', { ascending: false })
    .limit(1)

  if (error || !data?.[0]) return Response.json({ ad: null, slot })
  return Response.json({ ad: data[0], slot })
}
