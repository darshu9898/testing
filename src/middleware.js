import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { getOrSetSessionId } from './lib/session'

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

  const { pathname } = req.nextUrl
  
  // Skip middleware for static files
  if (pathname.match(/\.[a-zA-Z0-9]{1,6}$/)) {
    return res
  }
  
  // Skip auth for admin orders page
  if (pathname === '/admin/orders.html') {
    return res
  }

  // FIXED: More robust session checking with error handling
  let session = null
  try {
    // Refresh session if expired - this is crucial for SSR
    const { data: { session: currentSession }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.warn('Middleware session error:', error.message)
      // Clear potentially corrupted session cookies
      const cookieNames = ['sb-access-token', 'sb-refresh-token', 'supabase-auth-token']
      cookieNames.forEach(name => {
        res.cookies.delete(name)
      })
    } else {
      session = currentSession
    }
  } catch (err) {
    console.error('Middleware session fetch error:', err)
    // Clear session on error
    session = null
  }

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/profile', '/orders']
  
  // Auth routes (redirect if already logged in)
  const authRoutes = ['/login', '/register']

  // Check if accessing protected route
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!session) {
      console.log('🔒 Middleware: Redirecting to login for protected route:', pathname)
      const redirectUrl = new URL('/login', req.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // FIXED: More careful handling of auth route redirects
  if (authRoutes.some(route => pathname.startsWith(route))) {
    if (session) {
      // Double-check that the session is actually valid
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          console.log('🔒 Middleware: Invalid session found, clearing and allowing auth route access')
          // Clear invalid session
          const cookieNames = ['sb-access-token', 'sb-refresh-token']
          cookieNames.forEach(name => {
            res.cookies.delete(name)
          })
          return res // Allow access to auth routes
        }
        
        // Valid session exists, redirect away from auth routes
        console.log('🔒 Middleware: Valid session found, redirecting away from auth route:', pathname)
        const redirectTo = req.nextUrl.searchParams.get('redirect') || '/'
        return NextResponse.redirect(new URL(redirectTo, req.url))
      } catch (userFetchError) {
        console.error('🔒 Middleware: User fetch error:', userFetchError)
        // On error, allow access to auth routes
        return res
      }
    } else {
      console.log('🔒 Middleware: No session, allowing access to auth route:', pathname)
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