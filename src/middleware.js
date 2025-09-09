import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  const res = NextResponse.next()

  // Create Edge-compatible Supabase client
  const supabase = createMiddlewareClient({ req, res })

  // Get current session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { pathname } = req.nextUrl

  // Protected routes
  const protectedRoutes = ['/dashboard', '/profile', '/orders']
  const authRoutes = ['/login', '/register']

  // Redirect if user is not logged in
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!session) {
      const redirectUrl = new URL('/login', req.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Redirect away from auth routes if user is logged in
  if (authRoutes.some(route => pathname.startsWith(route))) {
    if (session) {
      const redirectTo = req.nextUrl.searchParams.get('redirect') || '/'
      return NextResponse.redirect(new URL(redirectTo, req.url))
    }
  }

  // Add security headers
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  if (process.env.NODE_ENV === 'production') {
    res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
