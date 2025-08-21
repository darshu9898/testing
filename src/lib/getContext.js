import { createSupabaseServerClient } from './supabase-server'
import prisma from './prisma'
import { getOrSetSessionId } from './session'

/**
 * Secure context getter with cookie-based session management
 * Returns: { user, userId, sessionId, accessToken, supabase, isAuthenticated }
 */
export async function getContext(req, res) {
  // 1) Ensure guest sessionId exists (HttpOnly cookie)
  const sessionId = getOrSetSessionId(req, res)

  // 2) Create server-bound Supabase client with secure cookie handling
  const supabase = createSupabaseServerClient(req, res)

  // 3) Try to get Supabase session (Supabase handles JWT verification internally)
  let supabaseUser = null
  let accessToken = null
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Supabase auth error:', error.message)
      // Clear potentially corrupted auth cookies
      await supabase.auth.signOut()
    } else if (session) {
      supabaseUser = session.user
      accessToken = session.access_token
      
      // Auto-refresh token if it's close to expiring (within 5 minutes)
      const expiresAt = session.expires_at * 1000
      const fiveMinutes = 5 * 60 * 1000
      
      if (expiresAt - Date.now() < fiveMinutes) {
        try {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
          if (refreshError) {
            console.error('Token refresh failed:', refreshError.message)
            await supabase.auth.signOut()
            supabaseUser = null
            accessToken = null
          } else if (refreshData.session) {
            supabaseUser = refreshData.session.user
            accessToken = refreshData.session.access_token
          }
        } catch (refreshErr) {
          console.error('Token refresh error:', refreshErr)
          supabaseUser = null
          accessToken = null
        }
      }
    }
  } catch (err) {
    console.error('Session retrieval error:', err)
    supabaseUser = null
    accessToken = null
  }

  // 4) Upsert user in Prisma if authenticated (based on your Users schema)
  let userId = null
  if (supabaseUser) {
    try {
      const upserted = await prisma.users.upsert({
        where: { supabaseId: supabaseUser.id },
        update: {
          userEmail: supabaseUser.email,
          userName: supabaseUser.user_metadata?.full_name || 
                   supabaseUser.user_metadata?.name || 
                   supabaseUser.email || 
                   'User',
          // Update timestamp handled by Prisma if you add updatedAt field
        },
        create: {
          supabaseId: supabaseUser.id,
          userEmail: supabaseUser.email,
          userName: supabaseUser.user_metadata?.full_name || 
                   supabaseUser.user_metadata?.name || 
                   supabaseUser.email || 
                   'User',
        },
      })
      userId = upserted.userId
    } catch (e) {
      console.error('Prisma user upsert error:', e)
      userId = null
    }
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