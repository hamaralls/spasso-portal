// Upload para Cloudflare R2 via AWS Signature v4 (Web Crypto — edge compatible)

const enc = new TextEncoder()

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function sha256(data: string | ArrayBuffer): Promise<string> {
  const input: BufferSource = typeof data === 'string' ? enc.encode(data) : data
  return toHex(await crypto.subtle.digest('SHA-256', input))
}

async function hmac(key: BufferSource, msg: string): Promise<ArrayBuffer> {
  const k = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  return crypto.subtle.sign('HMAC', k, enc.encode(msg))
}

async function signingKey(secret: string, date: string): Promise<ArrayBuffer> {
  const kDate    = await hmac(enc.encode('AWS4' + secret), date)
  const kRegion  = await hmac(kDate, 'auto')
  const kService = await hmac(kRegion, 's3')
  return           await hmac(kService, 'aws4_request')
}

export async function uploadToR2(
  key: string,
  body: ArrayBuffer,
  contentType: string
): Promise<string> {
  const accountId = process.env.R2_ACCOUNT_ID!
  const bucket    = process.env.R2_BUCKET_NAME!
  const accessKey = process.env.R2_ACCESS_KEY_ID!
  const secretKey = process.env.R2_SECRET_ACCESS_KEY!
  const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!

  const now          = new Date()
  const isoDate      = now.toISOString().slice(0, 10).replace(/-/g, '')
  const isoDateTime  = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

  const host      = `${accountId}.r2.cloudflarestorage.com`
  const bodyHash  = await sha256(body)

  const canonHeaders =
    `content-type:${contentType}\n` +
    `host:${host}\n` +
    `x-amz-content-sha256:${bodyHash}\n` +
    `x-amz-date:${isoDateTime}\n`

  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date'

  const canonRequest = [
    'PUT',
    `/${bucket}/${key}`,
    '',
    canonHeaders,
    signedHeaders,
    bodyHash,
  ].join('\n')

  const credScope    = `${isoDate}/auto/s3/aws4_request`
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    isoDateTime,
    credScope,
    await sha256(canonRequest),
  ].join('\n')

  const sk        = await signingKey(secretKey, isoDate)
  const signature = toHex(await hmac(sk, stringToSign))

  const auth = `AWS4-HMAC-SHA256 Credential=${accessKey}/${credScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  const res = await fetch(`https://${host}/${bucket}/${key}`, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
      'x-amz-content-sha256': bodyHash,
      'x-amz-date': isoDateTime,
      Authorization: auth,
    },
    body,
  })

  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`R2 upload falhou (${res.status}): ${txt}`)
  }

  return `${publicUrl}/${key}`
}

export function r2Key(filename: string): string {
  const now  = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const rand  = Math.random().toString(36).slice(2, 8)
  const ext   = filename.split('.').pop()?.toLowerCase() ?? 'jpg'
  return `uploads/${year}/${month}/${rand}.${ext}`
}
