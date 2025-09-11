import { createSupabaseServerClient } from './supabase-server'
import prisma from './prisma'
import { getOrSetSessionId } from './session'

// In-memory cache for user data (resets on server restart)
const userCache = new Map()
const sessionCache = new Map()
const CACHE_DURATION = 3 * 60 * 1000 // 3 minutes cache
const SESSION_CACHE_DURATION = 60 * 1000 // 1 minute for sessions

/**
 * Performance-optimized context getter with intelligent caching
 * Returns: { user, userId, sessionId, accessToken, supabase, isAuthenticated }
 */
export async function getContext(req, res) {
  const startTime = Date.now()
  
  // 1) Ensure guest sessionId exists (HttpOnly cookie)
  const sessionId = getOrSetSessionId(req, res)

  // 2) Create server-bound Supabase client with secure cookie handling
  const supabase = createSupabaseServerClient(req, res)

  // 3) Try to get Supabase session with caching
  let supabaseUser = null
  let accessToken = null
  
  // Extract potential session token for cache key
  const authCookie = req.cookies?.['sb-access-token'] || req.cookies?.['supabase-auth-token']
  const cacheKey = authCookie ? `session_${authCookie.substring(0, 20)}` : null
  
  // Check session cache first
  if (cacheKey) {
    const cachedSession = sessionCache.get(cacheKey)
    if (cachedSession && Date.now() - cachedSession.timestamp < SESSION_CACHE_DURATION) {
      supabaseUser = cachedSession.user
      accessToken = cachedSession.accessToken
      console.log(`⚡ Session cache hit (${Date.now() - startTime}ms)`)
    }
  }
  
  // If no cached session, fetch from Supabase
  if (!supabaseUser) {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Supabase auth error:', error.message)
        // Only clear cookies for specific auth errors
        if (error.message.includes('invalid') || error.message.includes('expired')) {
          await supabase.auth.signOut()
        }
      } else if (session) {
        supabaseUser = session.user
        accessToken = session.access_token
        
        // Cache the session
        if (cacheKey) {
          sessionCache.set(cacheKey, {
            user: supabaseUser,
            accessToken,
            timestamp: Date.now()
          })
        }
        
        // Only refresh if token expires within 2 minutes (reduced from 5)
        const expiresAt = session.expires_at * 1000
        const twoMinutes = 2 * 60 * 1000
        
        if (expiresAt - Date.now() < twoMinutes) {
          try {
            console.log('🔄 Refreshing token...')
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
            if (refreshError) {
              console.error('Token refresh failed:', refreshError.message)
              // Don't nullify user on refresh failure - continue with existing session
              console.log('⚠️ Continuing with existing session despite refresh failure')
            } else if (refreshData.session) {
              supabaseUser = refreshData.session.user
              accessToken = refreshData.session.access_token
              
              // Update cache with refreshed session
              if (cacheKey) {
                sessionCache.set(cacheKey, {
                  user: supabaseUser,
                  accessToken,
                  timestamp: Date.now()
                })
              }
            }
          } catch (refreshErr) {
            console.error('Token refresh error:', refreshErr)
            // Continue with existing session rather than failing
            console.log('⚠️ Using existing session due to refresh error')
          }
        }
      }
    } catch (err) {
      console.error('Session retrieval error:', err)
      supabaseUser = null
      accessToken = null
    }
  }

  // 4) Handle user data with intelligent caching and optimized queries
  let userId = null
  if (supabaseUser) {
    const userCacheKey = supabaseUser.id
    const cachedUser = userCache.get(userCacheKey)
    
    // Use cache if valid and recent
    if (cachedUser && Date.now() - cachedUser.timestamp < CACHE_DURATION) {
      userId = cachedUser.userId
      console.log(`🚀 User cache hit for ${supabaseUser.email} (${Date.now() - startTime}ms)`)
    } else {
      try {
        // First try to find existing user (much faster than upsert)
        let user = await prisma.users.findUnique({
          where: { supabaseId: supabaseUser.id },
          select: { userId: true, userName: true } // Only select what we need
        })

        if (!user) {
          // Only create if user doesn't exist
          console.log(`👤 Creating new user: ${supabaseUser.email}`)
          user = await prisma.users.create({
            data: {
              supabaseId: supabaseUser.id,
              userEmail: supabaseUser.email,
              userName: supabaseUser.user_metadata?.full_name || 
                       supabaseUser.user_metadata?.name || 
                       supabaseUser.email?.split('@')[0] || 
                       'User',
            },
            select: { userId: true, userName: true }
          })
        } else {
          // User exists - only update if name has changed (avoid unnecessary updates)
          const newName = supabaseUser.user_metadata?.full_name || 
                         supabaseUser.user_metadata?.name || 
                         supabaseUser.email?.split('@')[0] || 
                         'User'
          
          if (user.userName !== newName) {
            await prisma.users.update({
              where: { userId: user.userId },
              data: { 
                userName: newName,
                userEmail: supabaseUser.email // Keep email in sync
              }
            })
          }
        }

        userId = user.userId
        
        // Cache the result
        userCache.set(userCacheKey, {
          userId: user.userId,
          userName: user.userName,
          timestamp: Date.now()
        })
        
        console.log(`💾 User data processed for ${supabaseUser.email} (${Date.now() - startTime}ms)`)
      } catch (e) {
        console.error('User lookup/creation error:', e)
        
        // Handle specific Prisma errors
        if (e.code === 'P2002') {
          console.error('Duplicate user creation attempt:', supabaseUser.id)
          // Try to find the user that was created concurrently
          try {
            const existingUser = await prisma.users.findUnique({
              where: { supabaseId: supabaseUser.id },
              select: { userId: true }
            })
            if (existingUser) {
              userId = existingUser.userId
            }
          } catch (findError) {
            console.error('Failed to find existing user:', findError)
            userId = null
          }
        } else {
          userId = null
        }
      }
    }
  }

  const totalTime = Date.now() - startTime
  
  // Log slow operations for monitoring
  if (totalTime > 500) {
    console.warn(`⚠️ getContext took ${totalTime}ms - investigate performance`)
  }

  return {
    user: supabaseUser,
    userId,
    sessionId,
    accessToken,
    supabase,
    isAuthenticated: !!supabaseUser
  }
}

// Cache cleanup function - runs every 5 minutes
function cleanupCaches() {
  const now = Date.now()
  let userCleaned = 0
  let sessionCleaned = 0
  
  // Clean user cache
  for (const [key, value] of userCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      userCache.delete(key)
      userCleaned++
    }
  }
  
  // Clean session cache
  for (const [key, value] of sessionCache.entries()) {
    if (now - value.timestamp > SESSION_CACHE_DURATION) {
      sessionCache.delete(key)
      sessionCleaned++
    }
  }
  
  if (userCleaned > 0 || sessionCleaned > 0) {
    console.log(`🧹 Cache cleanup: ${userCleaned} users, ${sessionCleaned} sessions`)
  }
}

// Set up cache cleanup interval
if (typeof global !== 'undefined') {
  if (!global.cacheCleanupInterval) {
    global.cacheCleanupInterval = setInterval(cleanupCaches, 5 * 60 * 1000)
  }
}

// Export cache utilities for debugging
export const getCacheStats = () => ({
  userCache: {
    size: userCache.size,
    keys: Array.from(userCache.keys()).map(k => k.substring(0, 8) + '...')
  },
  sessionCache: {
    size: sessionCache.size,
    keys: Array.from(sessionCache.keys()).map(k => k.substring(0, 12) + '...')
  }
})

// Clear caches function for testing
export const clearCaches = () => {
  userCache.clear()
  sessionCache.clear()
  console.log('🗑️ All caches cleared')
}
