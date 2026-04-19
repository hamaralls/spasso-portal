import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

export async function POST(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  await supabase.rpc('increment_views', { article_slug: slug })

  return new Response(null, { status: 204 })
}
