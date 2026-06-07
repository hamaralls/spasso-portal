import { getSupabase } from '@/lib/supabase/edge'

export const runtime = 'edge'

async function findActiveAd(slot: string, now: string) {
  const { data, error } = await getSupabase()
    .from('house_ads')
    .select('id, name, image_url, link_url, slot')
    .eq('active', true)
    .eq('slot', slot)
    .lte('starts_at', now)
    .or(`ends_at.is.null,ends_at.gt.${now}`)
    .order('starts_at', { ascending: false })
    .limit(1)

  if (error || !data?.[0]) return null
  return data[0]
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const requestedSlot = url.searchParams.get('slot') ?? 'middle'
  const fallbackSlot = url.searchParams.get('fallbackSlot')
  const now = new Date().toISOString()

  const exactAd = await findActiveAd(requestedSlot, now)
  if (exactAd) {
    return Response.json({
      ad: exactAd,
      slot: requestedSlot,
      fallbackSlot,
      matchedSlot: requestedSlot,
    })
  }

  const fallbackAd = fallbackSlot && fallbackSlot !== requestedSlot
    ? await findActiveAd(fallbackSlot, now)
    : null

  return Response.json({
    ad: fallbackAd,
    slot: requestedSlot,
    fallbackSlot,
    matchedSlot: fallbackAd ? fallbackSlot : null,
  })
}
