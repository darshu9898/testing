import { createServerClient } from '@supabase/ssr'

export function createSupabaseServerClient(req, res) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return req?.cookies?.[name]
        },
        set(name, value, options) {
          if (!res?.setHeader) return
          
          const secureOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: options?.maxAge || 60 * 60 * 24 * 7, // 7 days default
            ...options
          }
          
          const cookieString = `${name}=${value}; ${Object.entries(secureOptions)
            .filter(([_, val]) => val !== undefined)
            .map(([key, val]) => {
              if (key === 'httpOnly') return 'HttpOnly'
              if (key === 'secure') return 'Secure'
              if (key === 'sameSite') return `SameSite=${val}`
              return `${key}=${val}`
            })
            .join('; ')}`
          
          // Handle multiple Set-Cookie headers
          const existingCookies = res.getHeader('Set-Cookie') || []
          const cookies = Array.isArray(existingCookies) ? existingCookies : [existingCookies].filter(Boolean)
          cookies.push(cookieString)
          res.setHeader('Set-Cookie', cookies)
        },
        remove(name, options) {
          if (!res?.setHeader) return
          const expiredCookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=lax; Path=/`
          const existingCookies = res.getHeader('Set-Cookie') || []
          const cookies = Array.isArray(existingCookies) ? existingCookies : [existingCookies].filter(Boolean)
          cookies.push(expiredCookie)
          res.setHeader('Set-Cookie', cookies)
        }
      }
    }
  )
}