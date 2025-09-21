// lib/getContext.js - Ultra-fast lightweight version
import { createSupabaseServerClient } from './supabase-server'
import prisma from './prisma'
import { getOrSetSessionId } from './session'

// Simple in-memory cache with 5-minute TTL
const userCache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function getContext(req, res) {
  const startTime = Date.now()
  
  try {
    // 1. Get session ID (fast)
    const sessionId = getOrSetSessionId(req, res)

    // 2. Create Supabase client
    const supabase = createSupabaseServerClient(req, res)

    // 3. Get Supabase session with short timeout
    const sessionPromise = supabase.auth.getSession()
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Auth timeout')), 1000) // 1 second only
    )
    
    let supabaseUser = null
    let accessToken = null
    
    try {
      const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise])
      
      if (session && !error) {
        supabaseUser = session.user
        accessToken = session.access_token
      }
    } catch (authError) {
      console.log('Auth timeout or error, continuing as guest')
    }

    // 4. Handle authenticated user
    if (supabaseUser) {
      const userId = await getUserIdFast(supabaseUser)
      
      console.log(`Context: ${Date.now() - startTime}ms`)
      
      return {
        user: supabaseUser,
        userId,
        sessionId,
        accessToken,
        supabase,
        isAuthenticated: true
      }
    }

    // 5. Return guest context
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
    console.error('getContext error:', error.message)
    
    // Fallback to guest
    const sessionId = getOrSetSessionId(req, res)
    const supabase = createSupabaseServerClient(req, res)
    
    return {
      user: null,
      userId: null,
      sessionId,
      accessToken: null,
      supabase,
      isAuthenticated: false
    }
  }
}

/**
 * Fast user ID lookup with simple caching
 */
async function getUserIdFast(supabaseUser) {
  const cacheKey = supabaseUser.id
  const cached = userCache.get(cacheKey)
  
  // Return cached if recent
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.userId
  }
  
  try {
    // Simple database lookup - find existing user first
    let user = await prisma.users.findUnique({
      where: { supabaseId: supabaseUser.id },
      select: { userId: true }
    })
    
    // Create if doesn't exist
    if (!user) {
      user = await prisma.users.create({
        data: {
          supabaseId: supabaseUser.id,
          userEmail: supabaseUser.email || '',
          userName: supabaseUser.email?.split('@')[0] || 'User',
        },
        select: { userId: true }
      })
    }
    
    // Cache the result
    userCache.set(cacheKey, {
      userId: user.userId,
      timestamp: Date.now()
    })
    
    // Simple cache cleanup (only if cache gets large)
    if (userCache.size > 100) {
      cleanupCache()
    }
    
    return user.userId
    
  } catch (error) {
    console.error('User lookup failed:', error.message)
    
    // Return cached on error if available
    return cached?.userId || null
  }
}

/**
 * Simple cache cleanup
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
  
  console.log(`Cleaned ${cleaned} expired cache entries`)
}