export const runtime = "nodejs";

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { getOrSetSessionId } from './lib/session';

export async function middleware(req) {
  const res = NextResponse.next();
  getOrSetSessionId(req, res);

  // ✅ Correct Supabase SSR client usage
  const supabase = createServerClient(
    { req, res }, // ⚠ Must pass req/res
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY // Use server-side key
  );

  const { pathname } = req.nextUrl;

  // Skip middleware for static files
  if (pathname.match(/\.[a-zA-Z0-9]{1,6}$/)) return res;

  // Skip admin orders page
  if (pathname === '/admin/orders.html') return res;

  // Session checking with error handling
  let session = null;
  try {
    const { data: { session: currentSession }, error } = await supabase.auth.getSession();
    if (!error && currentSession) session = currentSession;
    else if (error) console.warn('Middleware session error:', error.message);
  } catch (err) {
    console.error('Middleware session fetch error:', err);
    session = null;
  }

  // Protected routes
  const protectedRoutes = ['/dashboard', '/profile', '/orders'];
  if (protectedRoutes.some(route => pathname.startsWith(route)) && !session) {
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Auth routes
  const authRoutes = ['/login', '/register'];
  if (authRoutes.some(route => pathname.startsWith(route)) && session) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) {
        const redirectTo = req.nextUrl.searchParams.get('redirect') || '/';
        return NextResponse.redirect(new URL(redirectTo, req.url));
      }
    } catch (err) {
      console.error('Middleware user fetch error:', err);
      // Allow access if error occurs
    }
  }

  // Security headers
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  if (process.env.NODE_ENV === 'production') {
    res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
