// lib/getContext.js - Ultra-fast version
import { createSupabaseServerClient } from './supabase-server'
import prisma from './prisma'
import { getOrSetSessionId } from './session'

// Enhanced cache with longer TTL for better performance
const userCache = new Map()
const CACHE_TTL = 15 * 60 * 1000 // 15 minutes

export async function getContext(req, res) {
  const startTime = Date.now()
  
  try {
    // 1. Always get session ID first (this is fast)
    const sessionId = getOrSetSessionId(req, res)

    // 2. Try to get auth token from cookies/headers directly (skip Supabase call)
    const authHeader = req.headers.authorization
    const cookieToken = req.cookies['sb-access-token'] || req.cookies['supabase-auth-token']
    
    // If no auth indicators, return guest immediately
    if (!authHeader && !cookieToken) {
      console.log(`Fast guest context: ${Date.now() - startTime}ms`)
      return {
        user: null,
        userId: null,
        sessionId,
        accessToken: null,
        supabase: null, // Don't create Supabase client for guests
        isAuthenticated: false
      }
    }

    // 3. Only create Supabase client if we have auth indicators
    const supabase = createSupabaseServerClient(req, res)
    
    // 4. Ultra-fast auth check with minimal timeout
    let supabaseUser = null
    let accessToken = null
    
    try {
      // Set a very short timeout for production performance
      const authPromise = supabase.auth.getSession()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth timeout')), 300) // Only 300ms
      )
      
      const { data: { session }, error } = await Promise.race([authPromise, timeoutPromise])
      
      if (session && !error && session.user) {
        supabaseUser = session.user
        accessToken = session.access_token
      }
    } catch (authError) {
      // Fail fast - if auth is slow, treat as guest
      console.log(`Auth timeout, treating as guest: ${Date.now() - startTime}ms`)
      return {
        user: null,
        userId: null,
        sessionId,
        accessToken: null,
        supabase,
        isAuthenticated: false
      }
    }

    // 5. Handle authenticated user with fast lookup
    if (supabaseUser) {
      const userId = await getUserIdUltraFast(supabaseUser)
      
      console.log(`Auth context: ${Date.now() - startTime}ms`)
      
      return {
        user: supabaseUser,
        userId,
        sessionId,
        accessToken,
        supabase,
        isAuthenticated: true
      }
    }

    // 6. Fallback to guest
    console.log(`Guest context: ${Date.now() - startTime}ms`)
    return {
      user: null,
      userId: null,
      sessionId,
      accessToken: null,
      supabase,
      isAuthenticated: false
    }
    
  } catch (error) {
    console.error(`Context error (${Date.now() - startTime}ms):`, error.message)
    
    // Ultra-fast fallback
    const sessionId = getOrSetSessionId(req, res)
    return {
      user: null,
      userId: null,
      sessionId,
      accessToken: null,
      supabase: null,
      isAuthenticated: false
    }
  }
}

/**
 * Ultra-fast user ID lookup with aggressive caching
 */
async function getUserIdUltraFast(supabaseUser) {
  const cacheKey = supabaseUser.id
  const cached = userCache.get(cacheKey)
  
  // Return cached if exists (longer TTL for better performance)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.userId
  }
  
  const dbStart = Date.now()
  
  try {
    // Single optimized query
    const user = await prisma.users.upsert({
      where: { supabaseId: supabaseUser.id },
      create: {
        supabaseId: supabaseUser.id,
        userEmail: supabaseUser.email || '',
        userName: supabaseUser.email?.split('@')[0] || 'User',
      },
      update: {}, // Don't update anything, just get the user
      select: { userId: true }
    })
    
    console.log(`User lookup: ${Date.now() - dbStart}ms`)
    
    // Cache with longer TTL
    userCache.set(cacheKey, {
      userId: user.userId,
      timestamp: Date.now()
    })
    
    // Async cache cleanup (don't block)
    if (userCache.size > 50) {
      setImmediate(cleanupCache)
    }
    
    return user.userId
    
  } catch (error) {
    console.error('User lookup failed:', error.message)
    
    // Return cached even if expired on error
    return cached?.userId || null
  }
}

/**
 * Async cache cleanup
 */
function cleanupCache() {
  const now = Date.now()
  let cleaned = 0
  
  for (const [key, value] of userCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      userCache.delete(key)
      cleaned++
    }
  }
  
  if (cleaned > 0) {
    console.log(`Cleaned ${cleaned} expired cache entries`)
  }
}