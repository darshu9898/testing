// 1. Fixed src/lib/adminAuth.js
// src/lib/adminAuth.js

// Simple admin credentials - change these to your preferred values
const ADMIN_CREDENTIALS = {
  id: "admin123",
  password: "admin@2024"  // Updated to match your test HTML
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
  console.log('Validating credentials:', { adminId, passwordLength: adminPassword?.length })
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
    isAdmin: true
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
 * Validate admin session token
 */
export function validateAdminSession(token) {
  if (!token) {
    console.log('❌ No token provided for validation')
    return false
  }
  
  const session = adminSessions.get(token)
  if (!session) {
    console.log(`❌ Session not found for token: ${token.substring(0, 8)}...`)
    console.log(`📊 Available sessions: ${Array.from(adminSessions.keys()).map(k => k.substring(0, 8) + '...').join(', ')}`)
    return false
  }
  
  // Check if session has expired
  if (Date.now() > session.expiresAt) {
    console.log(`⏰ Session expired for token: ${token.substring(0, 8)}...`)
    adminSessions.delete(token)
    return false
  }
  
  console.log(`✅ Valid session found for token: ${token.substring(0, 8)}...`)
  return session.isAdmin === true
}

/**
 * Destroy admin session (logout)
 */
export function destroyAdminSession(token) {
  if (token) {
    adminSessions.delete(token)
    console.log(`🚪 Admin session destroyed: ${token.substring(0, 8)}...`)
  }
  return true
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
  console.log('🔐 Admin auth check started')
  
  // Extract token from multiple possible locations
  const authHeader = req.headers.authorization
  const adminTokenHeader = req.headers['x-admin-token']
  const bodyToken = req.body?.adminToken
  const queryToken = req.query?.adminToken
  
  let token = null
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.replace('Bearer ', '')
    console.log('🎯 Token found in Authorization header')
  } else if (adminTokenHeader) {
    token = adminTokenHeader
    console.log('🎯 Token found in x-admin-token header')
  } else if (bodyToken) {
    token = bodyToken
    console.log('🎯 Token found in request body')
  } else if (queryToken) {
    token = queryToken
    console.log('🎯 Token found in query params')
  }
  
  console.log('📝 Admin auth debug info:', {
    method: req.method,
    url: req.url,
    hasAuthHeader: !!authHeader,
    authHeaderValue: authHeader ? `${authHeader.substring(0, 20)}...` : null,
    hasAdminTokenHeader: !!adminTokenHeader,
    hasBodyToken: !!bodyToken,
    hasQueryToken: !!queryToken,
    extractedToken: token ? `${token.substring(0, 10)}...` : null,
    tokenLength: token?.length || 0,
    activeSessions: adminSessions.size
  })

  if (!validateAdminSession(token)) {
    console.log('❌ Admin authentication failed')
    res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Invalid or expired admin session',
      debug: process.env.NODE_ENV === 'development' ? {
        tokenProvided: !!token,
        tokenLength: token?.length || 0,
        activeSessions: adminSessions.size,
        availableSessions: Array.from(adminSessions.keys()).map(k => k.substring(0, 8) + '...')
      } : undefined
    })
    return false
  }
  
  console.log('✅ Admin authentication successful')
  return true
}

/**
 * Get session info
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
    remainingTime: session.expiresAt - Date.now()
  }
}