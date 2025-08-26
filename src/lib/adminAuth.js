// src/lib/adminAuth.js

const ADMIN_CREDENTIALS = {
  id: "admin123",
  password: "admin@2024"
}

// Admin session duration (in milliseconds) - 2 hours
const SESSION_DURATION = 2 * 60 * 60 * 1000

// In-memory session store (in production, use Redis or database)
const adminSessions = new Map()

/**
 * Generate a simple session token
 */
function generateSessionToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

/**
 * Validate admin login credentials
 */
export function validateAdminCredentials(adminId, adminPassword) {
  console.log('🔐 Validating credentials:', { adminId, passwordLength: adminPassword?.length })
  return adminId === ADMIN_CREDENTIALS.id && adminPassword === ADMIN_CREDENTIALS.password
}

/**
 * Create admin session after successful login
 */
export function createAdminSession() {
  const token = generateSessionToken()
  const expiresAt = Date.now() + SESSION_DURATION
  
  adminSessions.set(token, {
    createdAt: Date.now(),
    expiresAt,
    isAdmin: true,
    lastAccess: Date.now() // Track last access for debugging
  })
  
  // Clean up expired sessions
  cleanupExpiredSessions()
  
  console.log(`✅ Admin session created: ${token.substring(0, 8)}..., expires: ${new Date(expiresAt)}`)
  console.log(`📊 Active sessions: ${adminSessions.size}`)
  
  return {
    token,
    expiresAt: new Date(expiresAt)
  }
}

/**
 * Enhanced token extraction with multiple fallbacks
 */
function extractToken(req) {
  // Try multiple locations for token
  const authHeader = req.headers.authorization || req.headers.Authorization
  const adminTokenHeader = req.headers['x-admin-token'] || req.headers['X-Admin-Token']
  const bodyToken = req.body?.adminToken || req.body?.token
  const queryToken = req.query?.adminToken || req.query?.token
  
  let token = null
  let source = 'none'
  
  if (authHeader) {
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '').trim()
      source = 'Bearer header'
    } else if (authHeader.startsWith('bearer ')) {
      token = authHeader.replace('bearer ', '').trim()
      source = 'bearer header'
    } else {
      token = authHeader.trim()
      source = 'auth header'
    }
  } else if (adminTokenHeader) {
    token = adminTokenHeader.trim()
    source = 'x-admin-token header'
  } else if (bodyToken) {
    token = bodyToken.trim()
    source = 'request body'
  } else if (queryToken) {
    token = queryToken.trim()
    source = 'query params'
  }
  
  console.log(`🔍 Token extraction - Source: ${source}, Token: ${token ? token.substring(0, 12) + '...' : 'null'}`)
  return token
}

/**
 * Validate admin session token with enhanced logging
 */
export function validateAdminSession(token) {
  if (!token || typeof token !== 'string') {
    console.log('❌ Invalid token format:', { token: typeof token, length: token?.length })
    return false
  }
  
  const session = adminSessions.get(token)
  if (!session) {
    console.log(`❌ Session not found for token: ${token.substring(0, 8)}...`)
    console.log(`📊 Available sessions: ${Array.from(adminSessions.keys()).map(k => k.substring(0, 8) + '...').join(', ')}`)
    return false
  }
  
  // Check if session has expired
  const now = Date.now()
  if (now > session.expiresAt) {
    console.log(`⏰ Session expired for token: ${token.substring(0, 8)}... (expired ${new Date(session.expiresAt)})`)
    adminSessions.delete(token)
    return false
  }
  
  // Update last access time
  session.lastAccess = now
  adminSessions.set(token, session)
  
  const timeLeft = Math.round((session.expiresAt - now) / (1000 * 60)) // minutes
  console.log(`✅ Valid session found for token: ${token.substring(0, 8)}... (${timeLeft} minutes left)`)
  return true
}

/**
 * Destroy admin session (logout)
 */
export function destroyAdminSession(token) {
  if (token && adminSessions.has(token)) {
    adminSessions.delete(token)
    console.log(`🚪 Admin session destroyed: ${token.substring(0, 8)}...`)
    return true
  }
  console.log(`⚠️ Attempted to destroy non-existent session: ${token?.substring(0, 8)}...`)
  return false
}

/**
 * Clean up expired sessions
 */
function cleanupExpiredSessions() {
  const now = Date.now()
  let cleanedCount = 0
  for (const [token, session] of adminSessions) {
    if (now > session.expiresAt) {
      adminSessions.delete(token)
      cleanedCount++
    }
  }
  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned up ${cleanedCount} expired admin sessions`)
  }
}

/**
 * Enhanced middleware to check admin authentication
 */
export function requireAdminAuth(req, res) {
  const startTime = Date.now()
  console.log(`🔐 Admin auth check started for ${req.method} ${req.url}`)
  
  // Extract token using enhanced extraction
  const token = extractToken(req)
  
  console.log('📝 Admin auth debug info:', {
    method: req.method,
    url: req.url,
    hasToken: !!token,
    tokenLength: token?.length || 0,
    activeSessions: adminSessions.size,
    userAgent: req.headers['user-agent']?.substring(0, 50) + '...'
  })

  if (!token) {
    console.log('❌ No admin token provided')
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'No admin token provided',
      debug: process.env.NODE_ENV === 'development' ? {
        expectedHeaders: ['Authorization: Bearer <token>', 'x-admin-token: <token>'],
        receivedHeaders: Object.keys(req.headers).filter(h => h.toLowerCase().includes('auth') || h.toLowerCase().includes('token'))
      } : undefined
    })
  }

  if (!validateAdminSession(token)) {
    console.log('❌ Admin authentication failed - invalid or expired token')
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Invalid or expired admin session. Please login again.',
      code: 'INVALID_ADMIN_TOKEN',
      debug: process.env.NODE_ENV === 'development' ? {
        tokenProvided: !!token,
        tokenLength: token?.length || 0,
        tokenPrefix: token?.substring(0, 8) + '...',
        activeSessions: adminSessions.size,
        availableSessions: Array.from(adminSessions.keys()).map(k => k.substring(0, 8) + '...')
      } : undefined
    })
  }
  
  const duration = Date.now() - startTime
  console.log(`✅ Admin authentication successful (${duration}ms)`)
  return true
}

/**
 * Get session info with enhanced details
 */
export function getSessionInfo(token) {
  if (!token) return null
  
  const session = adminSessions.get(token)
  if (!session || Date.now() > session.expiresAt) {
    return null
  }
  
  return {
    token,
    expiresAt: new Date(session.expiresAt),
    remainingTime: session.expiresAt - Date.now(),
    lastAccess: new Date(session.lastAccess),
    isValid: true
  }
}

/**
 * Extend session expiry (optional utility)
 */
export function extendAdminSession(token, extraTimeMs = SESSION_DURATION) {
  if (!token) return false
  
  const session = adminSessions.get(token)
  if (!session) return false
  
  const newExpiresAt = Date.now() + extraTimeMs
  session.expiresAt = newExpiresAt
  session.lastAccess = Date.now()
  adminSessions.set(token, session)
  
  console.log(`🔄 Extended session for token: ${token.substring(0, 8)}... until ${new Date(newExpiresAt)}`)
  return true
}

// Cleanup expired sessions every 10 minutes
setInterval(cleanupExpiredSessions, 10 * 60 * 1000)