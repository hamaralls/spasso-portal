import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const REDACAO = 'https://redacao.jornalspassocidades.com.br'

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  if (pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/', REDACAO), 301)
  }

  if (pathname === '/login' || pathname === '/reset-password') {
    return NextResponse.redirect(new URL('/login', REDACAO), 301)
  }

  // URLs legadas do WordPress (`/?post_type=post&p=N`) -> home limpa.
  if (pathname === '/' && (searchParams.has('post_type') || searchParams.has('p'))) {
    return NextResponse.redirect(new URL('/', request.url), 301)
  }

  if (process.env.MAINTENANCE_MODE === 'true') {
    if (!pathname.startsWith('/api') && pathname !== '/manutencao') {
      return NextResponse.redirect(new URL('/manutencao', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manutencao).*)'],
}
