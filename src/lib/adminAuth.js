// src/lib/adminAuth.js

// Simple admin credentials - change these to your preferred values
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
  
  return {
    token,
    expiresAt: new Date(expiresAt)
  }
}

/**
 * Validate admin session token
 */
export function validateAdminSession(token) {
  if (!token) return false
  
  const session = adminSessions.get(token)
  if (!session) return false
  
  // Check if session has expired
  if (Date.now() > session.expiresAt) {
    adminSessions.delete(token)
    return false
  }
  
  return session.isAdmin === true
}

/**
 * Destroy admin session (logout)
 */
export function destroyAdminSession(token) {
  if (token) {
    adminSessions.delete(token)
  }
  return true
}

/**
 * Clean up expired sessions
 */
function cleanupExpiredSessions() {
  const now = Date.now()
  for (const [token, session] of adminSessions) {
    if (now > session.expiresAt) {
      adminSessions.delete(token)
    }
  }
}

/**
 * Middleware to check admin authentication
 * Use this in your admin API routes
 */
export function requireAdminAuth(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '') || 
                req.headers['x-admin-token'] ||
                req.body?.adminToken ||
                req.query?.adminToken

  if (!validateAdminSession(token)) {
    res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Invalid or expired admin session' 
    })
    return false
  }
  
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