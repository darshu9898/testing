import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { getOrSetSessionId } from './lib/session'
import { randomBytes } from 'crypto' 

export async function middleware(req) {
  const res = NextResponse.next()
  getOrSetSessionId(req, res)
  
  // Create Supabase client for middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value
        },
        set(name, value, options) {
          // Set cookie on request for immediate use
          req.cookies.set({
            name,
            value,
            ...options,
          })
          // Set cookie on response for browser
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name, options) {
          // Remove from request
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          // Remove from response
          res.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh session if expired - this is crucial for SSR
  await supabase.auth.getSession()

  const { pathname } = req.nextUrl

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/profile', '/orders', '/admin']
  
  // Auth routes (redirect if already logged in)
  const authRoutes = ['/login', '/register']

  // Check if accessing protected route
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      const redirectUrl = new URL('/login', req.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Redirect authenticated users away from auth pages
  if (authRoutes.some(route => pathname.startsWith(route))) {
    const { data: { session } } = await supabase.auth.getSession()
    
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
  
  // Add HSTS in production
  if (process.env.NODE_ENV === 'production') {
    res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

// ===== ALTERNATIVE: Simple middleware without Supabase (if you prefer) =====
// If you want to avoid Supabase in middleware entirely, use this simpler version:

/*
import { NextResponse } from 'next/server'

export async function middleware(req) {
  const res = NextResponse.next()
  const { pathname } = req.nextUrl

  // Add security headers
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  if (process.env.NODE_ENV === 'production') {
    res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }

  // Simple auth check based on cookies
  const authCookies = req.cookies.get('sb-access-token') || req.cookies.get('supabase-auth-token')
  const protectedRoutes = ['/dashboard', '/profile', '/orders', '/admin']
  const authRoutes = ['/login', '/register']

  // Redirect to login if accessing protected route without auth cookie
  if (protectedRoutes.some(route => pathname.startsWith(route)) && !authCookies) {
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect away from auth pages if already has auth cookie
  if (authRoutes.some(route => pathname.startsWith(route)) && authCookies) {
    const redirectTo = req.nextUrl.searchParams.get('redirect') || '/'
    return NextResponse.redirect(new URL(redirectTo, req.url))
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
*/