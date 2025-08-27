import { createServerClient } from '@supabase/ssr'

export function createSupabaseServerClient(req, res) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          const value = req?.cookies?.[name];
          console.log('🍪 Server: Getting cookie:', name, value ? 'exists' : 'missing');
          return value;
        },
        set(name, value, options) {
          console.log('🍪 Server: Setting cookie:', name, value ? 'with value' : 'empty', options);
          
          if (!res?.setHeader) {
            console.warn('⚠️ Server: No response object available for setting cookie:', name);
            return;
          }
          
          const secureOptions = {
            httpOnly: name.includes('refresh') ? true : false, // Only refresh tokens should be httpOnly
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: options?.maxAge || (name.includes('refresh') ? 60 * 60 * 24 * 7 : 60 * 60), // 7 days for refresh, 1 hour for access
            ...options
          }
          
          // Build cookie string
          let cookieString = `${name}=${value}`;
          
          if (secureOptions.maxAge) {
            cookieString += `; Max-Age=${secureOptions.maxAge}`;
          }
          if (secureOptions.path) {
            cookieString += `; Path=${secureOptions.path}`;
          }
          if (secureOptions.httpOnly) {
            cookieString += `; HttpOnly`;
          }
          if (secureOptions.secure) {
            cookieString += `; Secure`;
          }
          if (secureOptions.sameSite) {
            cookieString += `; SameSite=${secureOptions.sameSite}`;
          }
          
          // Handle multiple Set-Cookie headers
          const existingCookies = res.getHeader('Set-Cookie') || []
          const cookies = Array.isArray(existingCookies) ? existingCookies : [existingCookies].filter(Boolean)
          cookies.push(cookieString)
          res.setHeader('Set-Cookie', cookies)
          
          console.log('✅ Server: Cookie set successfully:', name);
        },
        remove(name, options) {
          console.log('🗑️ Server: Removing cookie:', name);
          
          if (!res?.setHeader) {
            console.warn('⚠️ Server: No response object available for removing cookie:', name);
            return;
          }
          
          const expiredCookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=lax; Path=/`;
          const existingCookies = res.getHeader('Set-Cookie') || []
          const cookies = Array.isArray(existingCookies) ? existingCookies : [existingCookies].filter(Boolean)
          cookies.push(expiredCookie)
          res.setHeader('Set-Cookie', cookies)
          
          console.log('✅ Server: Cookie removed successfully:', name);
        }
      }
    }
  )
}