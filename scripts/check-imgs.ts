import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

async function main() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {auth:{autoRefreshToken:false,persistSession:false}})
  const {count:total} = await sb.from('articles').select('*',{count:'exact',head:true})
  const {count:comImg} = await sb.from('articles').select('*',{count:'exact',head:true}).not('featured_image_url','is',null)
  const {count:semImg} = await sb.from('articles').select('*',{count:'exact',head:true}).is('featured_image_url',null)
  const {count:wpImg} = await sb.from('articles').select('*',{count:'exact',head:true}).like('featured_image_url','%jornalspassocidades%')
  console.log('Total:', total)
  console.log('Com imagem R2:', comImg)
  console.log('Sem imagem (null):', semImg)
  console.log('Ainda URL WP (não migrada):', wpImg)
}
main()
