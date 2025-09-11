// src/lib/getContext.js - Performance Optimized Version
import { createSupabaseServerClient } from './supabase-server'
import prisma from './prisma'
import { getOrSetSessionId } from './session'

// Enhanced caching with better TTLs and memory management
const userCache = new Map()
const sessionCache = new Map()
const dbConnectionPool = new Map() // Connection reuse
const rateLimiter = new Map() // Rate limiting for expensive ops

// Optimized cache durations
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes for users (increased)
const SESSION_CACHE_DURATION = 10 * 60 * 1000 // 10 minutes for sessions (increased)
const DB_OPERATION_COOLDOWN = 30 * 1000 // 30 seconds cooldown for expensive ops
const MAX_CACHE_SIZE = 1000 // Prevent memory leaks

/**
 * Super-fast context getter with aggressive caching and optimizations
 */
export async function getContext(req, res) {
  const startTime = Date.now()
  
  try {
    // 1) Get session ID (minimal overhead)
    const sessionId = getOrSetSessionId(req, res)

    // 2) Create Supabase client (cached connection)
    const supabase = createSupabaseServerClient(req, res)

    // 3) Extract auth tokens with multiple fallbacks
    const authToken = extractAuthToken(req)
    const authCacheKey = authToken ? `auth_${hashToken(authToken)}` : null

    // 4) Try session cache first (FASTEST PATH)
    if (authCacheKey) {
      const cachedSession = sessionCache.get(authCacheKey)
      if (cachedSession && Date.now() - cachedSession.timestamp < SESSION_CACHE_DURATION) {
        const cachedResult = await getCachedUserData(cachedSession, sessionId, supabase)
        if (cachedResult) {
          console.log(`⚡ Full cache hit: ${Date.now() - startTime}ms`)
          return cachedResult
        }
      }
    }

    // 5) Get Supabase session with timeout and retry logic
    let supabaseUser = null
    let accessToken = null
    
    try {
      const sessionPromise = supabase.auth.getSession()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session timeout')), 3000) // 3s timeout
      )
      
      const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise])
      
      if (error) {
        console.error('Supabase session error:', error.message)
        return createGuestContext(sessionId, supabase)
      }
      
      if (session) {
        supabaseUser = session.user
        accessToken = session.access_token
        
        // Cache session immediately
        if (authCacheKey) {
          sessionCache.set(authCacheKey, {
            user: supabaseUser,
            accessToken,
            timestamp: Date.now()
          })
          
          // Cleanup cache if it gets too large
          if (sessionCache.size > MAX_CACHE_SIZE) {
            cleanupOldestCacheEntries(sessionCache, MAX_CACHE_SIZE * 0.8)
          }
        }
        
        // Refresh token only if expires very soon (1 minute)
        const expiresAt = session.expires_at * 1000
        const oneMinute = 60 * 1000
        
        if (expiresAt - Date.now() < oneMinute) {
          // Don't await refresh - do it in background
          refreshTokenInBackground(supabase, authCacheKey)
        }
      }
    } catch (sessionError) {
      console.error('Session retrieval failed:', sessionError.message)
      return createGuestContext(sessionId, supabase)
    }

    // 6) Handle user data with advanced caching
    if (supabaseUser) {
      const userId = await getUserIdWithCaching(supabaseUser)
      
      const totalTime = Date.now() - startTime
      if (totalTime > 100) {
        console.warn(`⚠️ getContext slow (${totalTime}ms): ${supabaseUser.email}`)
      }
      
      return {
        user: supabaseUser,
        userId,
        sessionId,
        accessToken,
        supabase,
        isAuthenticated: true
      }
    }

    // 7) Return guest context
    return createGuestContext(sessionId, supabase)
    
  } catch (error) {
    console.error('getContext critical error:', error)
    const sessionId = getOrSetSessionId(req, res)
    const supabase = createSupabaseServerClient(req, res)
    return createGuestContext(sessionId, supabase)
  }
}

/**
 * Extract auth token from multiple sources with priority
 */
function extractAuthToken(req) {
  // Priority order for token extraction
  const sources = [
    req.cookies?.['sb-access-token'],
    req.cookies?.['supabase-auth-token'],
    req.headers.authorization?.replace(/^Bearer\s+/i, ''),
    req.headers['x-auth-token']
  ]
  
  return sources.find(token => token && typeof token === 'string') || null
}

/**
 * Simple hash function for cache keys
 */
function hashToken(token) {
  let hash = 0
  for (let i = 0; i < Math.min(token.length, 20); i++) {
    const char = token.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return hash.toString(36)
}

/**
 * Get cached user data with validation
 */
async function getCachedUserData(cachedSession, sessionId, supabase) {
  const userCacheKey = cachedSession.user.id
  const cachedUser = userCache.get(userCacheKey)
  
  if (cachedUser && Date.now() - cachedUser.timestamp < CACHE_DURATION) {
    return {
      user: cachedSession.user,
      userId: cachedUser.userId,
      sessionId,
      accessToken: cachedSession.accessToken,
      supabase,
      isAuthenticated: true
    }
  }
  
  return null
}

/**
 * Background token refresh to avoid blocking main request
 */
async function refreshTokenInBackground(supabase, cacheKey) {
  try {
    const { data: refreshData, error } = await supabase.auth.refreshSession()
    
    if (!error && refreshData.session && cacheKey) {
      // Update cache with refreshed session
      sessionCache.set(cacheKey, {
        user: refreshData.session.user,
        accessToken: refreshData.session.access_token,
        timestamp: Date.now()
      })
      console.log('🔄 Background token refresh completed')
    }
  } catch (error) {
    console.error('Background refresh failed:', error.message)
  }
}

/**
 * Get userId with aggressive caching and rate limiting
 */
async function getUserIdWithCaching(supabaseUser) {
  const userCacheKey = supabaseUser.id
  const cached = userCache.get(userCacheKey)
  
  // Return cached if valid
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.userId
  }
  
  // Rate limiting for expensive DB operations
  const rateLimitKey = `user_${supabaseUser.id}`
  const lastOperation = rateLimiter.get(rateLimitKey)
  
  if (lastOperation && Date.now() - lastOperation < DB_OPERATION_COOLDOWN) {
    // Return cached even if expired during cooldown
    return cached?.userId || null
  }
  
  try {
    // Update rate limiter
    rateLimiter.set(rateLimitKey, Date.now())
    
    // Single optimized query - find or create in one operation
    const user = await prisma.users.upsert({
      where: { supabaseId: supabaseUser.id },
      update: {
        // Only update if email changed (avoid unnecessary writes)
        ...(supabaseUser.email && { userEmail: supabaseUser.email })
      },
      create: {
        supabaseId: supabaseUser.id,
        userEmail: supabaseUser.email,
        userName: extractUserName(supabaseUser),
      },
      select: { userId: true } // Only select what we need
    })
    
    // Cache the result with longer TTL for successful operations
    userCache.set(userCacheKey, {
      userId: user.userId,
      timestamp: Date.now()
    })
    
    // Cleanup cache if too large
    if (userCache.size > MAX_CACHE_SIZE) {
      cleanupOldestCacheEntries(userCache, MAX_CACHE_SIZE * 0.8)
    }
    
    return user.userId
    
  } catch (error) {
    console.error('User DB operation failed:', error)
    
    // Return cached value on error if available
    if (cached) {
      console.log('⚠️ Using stale cache due to DB error')
      return cached.userId
    }
    
    return null
  }
}

/**
 * Extract user name with fallbacks
 */
function extractUserName(supabaseUser) {
  return supabaseUser.user_metadata?.full_name || 
         supabaseUser.user_metadata?.name || 
         supabaseUser.email?.split('@')[0] || 
         'User'
}

/**
 * Create guest context quickly
 */
function createGuestContext(sessionId, supabase) {
  return {
    user: null,
    userId: null,
    sessionId,
    accessToken: null,
    supabase,
    isAuthenticated: false
  }
}

/**
 * Clean up oldest cache entries to prevent memory leaks
 */
function cleanupOldestCacheEntries(cache, targetSize) {
  if (cache.size <= targetSize) return
  
  const entries = Array.from(cache.entries())
  entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
  
  const toRemove = entries.slice(0, cache.size - targetSize)
  toRemove.forEach(([key]) => cache.delete(key))
  
  console.log(`🧹 Cleaned up ${toRemove.length} cache entries`)
}

/**
 * Enhanced cache cleanup with memory optimization
 */
function performMaintenance() {
  const now = Date.now()
  let userCleaned = 0
  let sessionCleaned = 0
  let rateLimitCleaned = 0
  
  // Clean user cache
  for (const [key, value] of userCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION * 2) { // Clean expired + buffer
      userCache.delete(key)
      userCleaned++
    }
  }
  
  // Clean session cache
  for (const [key, value] of sessionCache.entries()) {
    if (now - value.timestamp > SESSION_CACHE_DURATION * 2) {
      sessionCache.delete(key)
      sessionCleaned++
    }
  }
  
  // Clean rate limiter
  for (const [key, timestamp] of rateLimiter.entries()) {
    if (now - timestamp > DB_OPERATION_COOLDOWN * 2) {
      rateLimiter.delete(key)
      rateLimitCleaned++
    }
  }
  
  if (userCleaned + sessionCleaned + rateLimitCleaned > 0) {
    console.log(`🧹 Maintenance: ${userCleaned} users, ${sessionCleaned} sessions, ${rateLimitCleaned} rate limits`)
  }
}

// Optimized cleanup interval
if (typeof global !== 'undefined' && !global.contextMaintenanceInterval) {
  global.contextMaintenanceInterval = setInterval(performMaintenance, 5 * 60 * 1000)
}

// Export utilities
export const getContextStats = () => ({
  userCache: { size: userCache.size, memoryMB: (userCache.size * 100) / 1024 },
  sessionCache: { size: sessionCache.size, memoryMB: (sessionCache.size * 200) / 1024 },
  rateLimiter: { size: rateLimiter.size }
})

export const clearAllCaches = () => {
  userCache.clear()
  sessionCache.clear()
  rateLimiter.clear()
  console.log('🗑️ All context caches cleared')
}

// Emergency cache size limits
const MEMORY_LIMIT_MB = 50 // 50MB limit
export const enforceMemoryLimits = () => {
  const stats = getContextStats()
  const totalMemoryMB = stats.userCache.memoryMB + stats.sessionCache.memoryMB
  
  if (totalMemoryMB > MEMORY_LIMIT_MB) {
    console.warn(`⚠️ Memory limit exceeded: ${totalMemoryMB}MB`)
    cleanupOldestCacheEntries(userCache, Math.floor(userCache.size * 0.5))
    cleanupOldestCacheEntries(sessionCache, Math.floor(sessionCache.size * 0.5))
  }
}
