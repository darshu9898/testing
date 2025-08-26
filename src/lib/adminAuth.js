// src/lib/adminAuth.js - Database-based session management

import prisma from './prisma'

const ADMIN_CREDENTIALS = {
  id: "admin123",
  password: "admin@2024"
}

// Admin session duration (in milliseconds) - 2 hours
const SESSION_DURATION = 2 * 60 * 60 * 1000

/**
 * Generate a cryptographically secure session token
 */
function generateSessionToken() {
  // Use crypto for better randomness
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }
  
  // Fallback for older environments
  return Math.random().toString(36).substring(2) + 
         Date.now().toString(36) + 
         Math.random().toString(36).substring(2)
}

/**
 * Validate admin login credentials
 */
export function validateAdminCredentials(adminId, adminPassword) {
  console.log('🔐 Validating credentials:', { adminId, passwordLength: adminPassword?.length })
  return adminId === ADMIN_CREDENTIALS.id && adminPassword === ADMIN_CREDENTIALS.password
}

/**
 * Create admin session in database after successful login
 */
export async function createAdminSession() {
  const token = generateSessionToken()
  const expiresAt = new Date(Date.now() + SESSION_DURATION)
  
  try {
    // Clean up any expired sessions first
    await cleanupExpiredSessions()
    
    // Create new session in database
    await prisma.$executeRaw`
      INSERT INTO admin_sessions (token, expires_at, created_at, last_access)
      VALUES (${token}, ${expiresAt}, NOW(), NOW())
      ON CONFLICT (token) DO NOTHING
    `
    
    console.log(`✅ Admin session created in DB: ${token.substring(0, 8)}..., expires: ${expiresAt}`)
    
    return {
      token,
      expiresAt
    }
  } catch (error) {
    console.error('Failed to create admin session in database:', error)
    throw new Error('Session creation failed')
  }
}

/**
 * Validate admin session token from database
 */
export async function validateAdminSession(token) {
  if (!token || typeof token !== 'string') {
    console.log('❌ Invalid token format:', { token: typeof token, length: token?.length })
    return false
  }
  
  try {
    // Get session from database
    const session = await prisma.$queryRaw`
      SELECT token, expires_at, created_at, last_access
      FROM admin_sessions 
      WHERE token = ${token} 
      AND expires_at > NOW()
      LIMIT 1
    `
    
    if (!session || session.length === 0) {
      console.log(`❌ Session not found or expired for token: ${token.substring(0, 8)}...`)
      return false
    }
    
    const sessionData = session[0]
    const now = new Date()
    const expiresAt = new Date(sessionData.expires_at)
    
    if (now > expiresAt) {
      console.log(`⏰ Session expired for token: ${token.substring(0, 8)}... (expired ${expiresAt})`)
      // Clean up expired session
      await prisma.$executeRaw`DELETE FROM admin_sessions WHERE token = ${token}`
      return false
    }
    
    // Update last access time
    await prisma.$executeRaw`
      UPDATE admin_sessions 
      SET last_access = NOW() 
      WHERE token = ${token}
    `
    
    const timeLeft = Math.round((expiresAt - now) / (1000 * 60)) // minutes
    console.log(`✅ Valid session found in DB for token: ${token.substring(0, 8)}... (${timeLeft} minutes left)`)
    return true
    
  } catch (error) {
    console.error('Database session validation error:', error)
    return false
  }
}

/**
 * Destroy admin session (logout) from database
 */
export async function destroyAdminSession(token) {
  if (!token) {
    console.log('⚠️ No token provided for session destruction')
    return false
  }
  
  try {
    const result = await prisma.$executeRaw`
      DELETE FROM admin_sessions WHERE token = ${token}
    `
    
    console.log(`🚪 Admin session destroyed from DB: ${token.substring(0, 8)}...`)
    return true
  } catch (error) {
    console.error('Failed to destroy session:', error)
    return false
  }
}

/**
 * Clean up expired sessions from database
 */
async function cleanupExpiredSessions() {
  try {
    const result = await prisma.$executeRaw`
      DELETE FROM admin_sessions WHERE expires_at < NOW()
    `
    
    if (result > 0) {
      console.log(`🧹 Cleaned up expired admin sessions from database`)
    }
  } catch (error) {
    console.error('Failed to cleanup expired sessions:', error)
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
 * Enhanced middleware to check admin authentication
 */
export async function requireAdminAuth(req, res) {
  const startTime = Date.now()
  console.log(`🔐 Admin auth check started for ${req.method} ${req.url}`)
  
  // Extract token using enhanced extraction
  const token = extractToken(req)
  
  console.log('📝 Admin auth debug info:', {
    method: req.method,
    url: req.url,
    hasToken: !!token,
    tokenLength: token?.length || 0,
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

  const isValid = await validateAdminSession(token)
  if (!isValid) {
    console.log('❌ Admin authentication failed - invalid or expired token')
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Invalid or expired admin session. Please login again.',
      code: 'INVALID_ADMIN_TOKEN',
      debug: process.env.NODE_ENV === 'development' ? {
        tokenProvided: !!token,
        tokenLength: token?.length || 0,
        tokenPrefix: token?.substring(0, 8) + '...'
      } : undefined
    })
  }
  
  const duration = Date.now() - startTime
  console.log(`✅ Admin authentication successful (${duration}ms)`)
  return true
}

/**
 * Get session info from database
 */
export async function getSessionInfo(token) {
  if (!token) return null
  
  try {
    const session = await prisma.$queryRaw`
      SELECT token, expires_at, created_at, last_access
      FROM admin_sessions 
      WHERE token = ${token} 
      AND expires_at > NOW()
      LIMIT 1
    `
    
    if (!session || session.length === 0) {
      return null
    }
    
    const sessionData = session[0]
    const expiresAt = new Date(sessionData.expires_at)
    const now = new Date()
    
    return {
      token,
      expiresAt,
      remainingTime: expiresAt.getTime() - now.getTime(),
      lastAccess: new Date(sessionData.last_access),
      createdAt: new Date(sessionData.created_at),
      isValid: expiresAt > now
    }
  } catch (error) {
    console.error('Failed to get session info:', error)
    return null
  }
}

/**
 * Extend session expiry in database
 */
export async function extendAdminSession(token, extraTimeMs = SESSION_DURATION) {
  if (!token) return false
  
  try {
    const newExpiresAt = new Date(Date.now() + extraTimeMs)
    
    const result = await prisma.$executeRaw`
      UPDATE admin_sessions 
      SET expires_at = ${newExpiresAt}, last_access = NOW()
      WHERE token = ${token}
      AND expires_at > NOW()
    `
    
    if (result > 0) {
      console.log(`🔄 Extended session in DB for token: ${token.substring(0, 8)}... until ${newExpiresAt}`)
      return true
    }
    
    return false
  } catch (error) {
    console.error('Failed to extend session:', error)
    return false
  }
}

/**
 * Get all active sessions (for admin monitoring)
 */
export async function getActiveSessions() {
  try {
    const sessions = await prisma.$queryRaw`
      SELECT token, expires_at, created_at, last_access
      FROM admin_sessions 
      WHERE expires_at > NOW()
      ORDER BY last_access DESC
    `
    
    return sessions.map(session => ({
      tokenPrefix: session.token.substring(0, 8) + '...',
      expiresAt: new Date(session.expires_at),
      createdAt: new Date(session.created_at),
      lastAccess: new Date(session.last_access),
      remainingTime: new Date(session.expires_at).getTime() - Date.now()
    }))
  } catch (error) {
    console.error('Failed to get active sessions:', error)
    return []
  }
}

// Cleanup expired sessions every 15 minutes
setInterval(async () => {
  try {
    await cleanupExpiredSessions()
  } catch (error) {
    console.error('Scheduled cleanup failed:', error)
  }
}, 15 * 60 * 1000)