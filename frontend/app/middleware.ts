// frontend/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('sk_token')?.value
  const isAuth = request.nextUrl.pathname.startsWith('/login')
  if (!token && !isAuth) return NextResponse.redirect(new URL('/login', request.url))
  if (token && isAuth) return NextResponse.redirect(new URL('/dashboard', request.url))
}
export const config = { matcher: ['/((?!api|_next|favicon).*)'] }