import { randomBytes } from 'crypto'

const SESSION_COOKIE_NAME = 'guest_session_id'
const SESSION_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 30, // 30 days for guest sessions
  path: '/'
}

export function getOrSetSessionId(req, res) {
  // Check if session exists in cookies
  let sessionId = req?.cookies?.[SESSION_COOKIE_NAME]
  
  if (!sessionId) {
    // Generate new session ID for guest users
    sessionId = randomBytes(32).toString('hex')
    
    // Set cookie in response
    if (res?.setHeader) {
      const cookieValue = `${SESSION_COOKIE_NAME}=${sessionId}; ${Object.entries(SESSION_OPTIONS)
        .map(([key, value]) => {
          if (key === 'httpOnly') return 'HttpOnly'
          if (key === 'secure' && value) return 'Secure'
          if (key === 'sameSite') return `SameSite=${value}`
          return `${key}=${value}`
        })
        .join('; ')}`
        
      const existingCookies = res.getHeader('Set-Cookie') || []
      const cookies = Array.isArray(existingCookies) ? existingCookies : [existingCookies].filter(Boolean)
      cookies.push(cookieValue)
      res.setHeader('Set-Cookie', cookies)
    }
  }
  
  return sessionId
}

export function clearSession(res) {
  if (res?.setHeader) {
    const expiredCookie = `${SESSION_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=lax; Path=/`
    const existingCookies = res.getHeader('Set-Cookie') || []
    const cookies = Array.isArray(existingCookies) ? existingCookies : [existingCookies].filter(Boolean)
    cookies.push(expiredCookie)
    res.setHeader('Set-Cookie', cookies)
  }
}