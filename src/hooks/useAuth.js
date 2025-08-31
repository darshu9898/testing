// src/hooks/useAuth.js - Enhanced with reliable cart merge
import { createSupabaseBrowserClient } from '@/lib/supabase-client'
import { useState, useEffect, createContext, useContext } from 'react'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    console.log('🔄 AuthProvider: Component mounting...')
    setMounted(true)
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔍 AuthProvider: Getting initial session...')
        console.log('🍪 AuthProvider: Document cookies:', document.cookie.split(';').filter(c => c.includes('sb-') || c.includes('supabase')))
        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        console.log('📡 AuthProvider: Initial session response:', { 
          hasSession: !!session, 
          hasUser: !!session?.user,
          userEmail: session?.user?.email,
          error: error?.message 
        })
        
        if (error) {
          console.error('❌ AuthProvider: Initial session error:', error)
          setUser(null)
        } else if (session) {
          console.log('✅ AuthProvider: Initial session found for:', session.user.email)
          console.log('🕒 AuthProvider: Session expires at:', new Date(session.expires_at * 1000))
          setUser(session.user)
        } else {
          console.log('ℹ️ AuthProvider: No initial session found')
          setUser(null)
        }
      } catch (err) {
        console.error('💥 AuthProvider: Session fetch error:', err)
        setUser(null)
      } finally {
        console.log('🏁 AuthProvider: Initial session check complete, setting loading to false')
        setLoading(false)
        setInitialized(true)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 AuthProvider: Auth state change detected:', event, {
          hasSession: !!session,
          userEmail: session?.user?.email || 'no user',
          timestamp: new Date().toISOString()
        })
        
        setUser(session?.user || null)
        setLoading(false)
        
        // Enhanced cart merge when user signs in
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('🛒 AuthProvider: User signed in, attempting cart merge...')
          await handleCartMerge()
        }
      }
    )

    return () => {
      console.log('🧹 AuthProvider: Cleaning up auth subscription')
      subscription?.unsubscribe()
    }
  }, [supabase])

  // Enhanced cart merge function with retries
  const handleCartMerge = async (retries = 3) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🛒 AuthProvider: Cart merge attempt ${attempt}/${retries}`)
        
        const response = await fetch('/api/cart/merge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        })
        
        const result = await response.json()
        
        if (response.ok) {
          console.log('✅ AuthProvider: Cart merge successful:', result)
          
          // Trigger cart refresh in any cart components
          window.dispatchEvent(new CustomEvent('cartUpdated', { 
            detail: { action: 'merged', itemsCount: result.itemsCount } 
          }))
          
          // Also trigger specific merge event
          window.dispatchEvent(new CustomEvent('cartMerged', { 
            detail: { action: 'merged', itemsCount: result.itemsCount } 
          }))
          
          return result
        } else {
          console.warn(`⚠️ AuthProvider: Cart merge attempt ${attempt} failed:`, result.error)
          
          if (attempt === retries) {
            throw new Error(result.error || 'Cart merge failed after all retries')
          }
          
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, attempt * 1000))
        }
      } catch (error) {
        console.warn(`⚠️ AuthProvider: Cart merge attempt ${attempt} error:`, error.message)
        
        if (attempt === retries) {
          console.error('❌ AuthProvider: Cart merge failed after all retries:', error.message)
          return null
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, attempt * 1000))
      }
    }
  }

  const signIn = async (email, password) => {
    try {
      console.log('🚀 AuthProvider: Starting sign in for:', email)
      setLoading(true)
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      })
      
      const result = await response.json()
      console.log('📡 AuthProvider: Login API response:', response.status, result)
      
      if (!response.ok) {
        console.log('❌ AuthProvider: Login failed:', result.error)
        setLoading(false)
        return { success: false, error: result.error || 'Login failed' }
      }

      // Wait longer for cookies to be set
      console.log('⏳ AuthProvider: Waiting for auth cookies to be set...')
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Check cookies after login
      const cookies = document.cookie.split(';').filter(c => c.includes('supabase') || c.includes('sb-'))
      console.log('🍪 AuthProvider: Cookies after login:', cookies.length, 'found:', cookies.map(c => c.split('=')[0].trim()))

      // Force refresh the session multiple times if needed
      let sessionRefreshAttempts = 0
      const maxAttempts = 3
      
      while (sessionRefreshAttempts < maxAttempts) {
        console.log(`🔄 AuthProvider: Session refresh attempt ${sessionRefreshAttempts + 1}/${maxAttempts}`)
        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (session) {
          console.log('✅ AuthProvider: Session refresh successful on attempt:', sessionRefreshAttempts + 1)
          setUser(session.user)
          setLoading(false)
          
          // Cart merge will be handled by the auth state change listener
          // No need to call it here to avoid double merging
          
          return { success: true, user: session.user }
        } else if (error) {
          console.error('❌ AuthProvider: Session refresh error:', error)
        } else {
          console.warn('⚠️ AuthProvider: No session found on attempt:', sessionRefreshAttempts + 1)
        }
        
        sessionRefreshAttempts++
        if (sessionRefreshAttempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
      
      // If session refresh failed, try manual session setup
      if (sessionRefreshAttempts === maxAttempts && result.session) {
        console.log('🔧 AuthProvider: Attempting manual session setup...')
        try {
          const { data: manualSession, error: manualError } = await supabase.auth.setSession({
            access_token: result.session.access_token,
            refresh_token: result.session.refresh_token
          })
          
          if (manualError) {
            console.error('❌ AuthProvider: Manual session setup failed:', manualError)
            setLoading(false)
            return { success: false, error: 'Session setup failed' }
          } else if (manualSession.session) {
            console.log('✅ AuthProvider: Manual session setup successful:', manualSession.user.email)
            setUser(manualSession.user)
            setLoading(false)
            
            // Manually trigger cart merge since auth state change might not fire
            setTimeout(() => {
              handleCartMerge()
            }, 500)
            
            return { success: true, user: manualSession.user }
          }
        } catch (manualErr) {
          console.error('💥 AuthProvider: Manual session setup error:', manualErr)
          setLoading(false)
          return { success: false, error: 'Authentication failed' }
        }
      }
      
      setLoading(false)
      return { success: false, error: 'Session creation failed' }
      
    } catch (error) {
      console.error('💥 AuthProvider: Sign in error:', error)
      setLoading(false)
      return { success: false, error: error.message || 'Network error occurred' }
    }
  }

  const signUp = async (email, password, fullName) => {
    try {
      console.log('🚀 AuthProvider: Starting sign up for:', email)
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName }),
        credentials: 'include'
      })
      
      const result = await response.json()
      console.log('📡 AuthProvider: Register API response:', response.status, result)
      
      if (!response.ok) throw new Error(result.error)
      return result
    } catch (error) {
      console.error('💥 AuthProvider: Sign up error:', error)
      throw error
    }
  }

  const signInWithGoogle = async () => {
    try {
      console.log('🚀 AuthProvider: Starting Google sign in...')
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`
        }
      })
      if (error) throw error
    } catch (error) {
      console.error('💥 AuthProvider: Google sign in error:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      console.log('🚀 AuthProvider: Starting sign out...')
      
      // Call our logout API first
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      
      if (!response.ok) {
        const result = await response.json()
        console.error('❌ AuthProvider: Logout API failed:', result.error)
        throw new Error(result.error)
      }
      
      // Then sign out from Supabase client
      await supabase.auth.signOut()
      
      // Force state update
      setUser(null)
      console.log('✅ AuthProvider: Sign out successful')
    } catch (error) {
      console.error('💥 AuthProvider: Sign out error:', error)
      throw error
    }
  }

  // Debug current state changes
  useEffect(() => {
    if (mounted) {
      console.log('🔍 AuthProvider: State update -', {
        user: user?.email || 'none',
        loading,
        mounted,
        timestamp: new Date().toISOString()
      })
    }
  }, [user, loading, mounted])

  // Prevent hydration issues - wait for both mounting and initialization
  if (!mounted || !initialized) {
    console.log('⏳ AuthProvider: Not ready yet - mounted:', mounted, 'initialized:', initialized)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2F674A]"></div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      isAuthenticated: !!user,
      handleCartMerge // Expose cart merge function
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}