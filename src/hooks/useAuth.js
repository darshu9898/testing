import { createSupabaseBrowserClient } from '@/lib/supabase-client'
import { useState, useEffect, createContext, useContext } from 'react'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    setMounted(true)
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔍 Getting initial session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ Initial session error:', error)
          setUser(null)
        } else if (session) {
          console.log('✅ Initial session found:', session.user.email)
          setUser(session.user)
        } else {
          console.log('ℹ️ No initial session found')
          setUser(null)
        }
      } catch (err) {
        console.error('💥 Session fetch error:', err)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event, session?.user?.email || 'no user')
        setUser(session?.user || null)
        setLoading(false)
        
        // Merge guest cart when user signs in (non-blocking)
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('🛒 Attempting cart merge...')
          try {
            const response = await fetch('/api/cart/merge', {
              method: 'POST',
              credentials: 'include'
            })
            if (response.ok) {
              console.log('✅ Cart merge successful')
            } else {
              console.warn('⚠️ Cart merge failed with status:', response.status)
            }
          } catch (error) {
            console.warn('⚠️ Cart merge failed:', error.message)
          }
        }
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [supabase])

  const signIn = async (email, password) => {
    try {
      console.log('🚀 Starting sign in for:', email)
      setLoading(true)
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      })
      
      const result = await response.json()
      console.log('📡 Login API response:', response.status, result)
      
      if (!response.ok) {
        throw new Error(result.error)
      }

      // If API login successful, the cookies should now be set
      // Let's wait a moment and then refresh the session
      console.log('⏳ Waiting for cookies to be set...')
      await new Promise(resolve => setTimeout(resolve, 500))

      // Check cookies again
      const cookies = document.cookie.split(';').filter(c => c.includes('supabase') || c.includes('sb-'))
      console.log('🍪 Cookies after login:', cookies.length, 'found')

      // Force refresh the session
      console.log('🔄 Refreshing session after login...')
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('❌ Session refresh error:', error)
      }
      
      if (session) {
        console.log('✅ Session refreshed successfully:', session.user.email)
        setUser(session.user)
      } else {
        console.warn('⚠️ No session found after login')
        // Try manual session setup with the returned tokens
        if (result.session) {
          console.log('🔧 Attempting manual session setup...')
          try {
            const { data: manualSession, error: manualError } = await supabase.auth.setSession({
              access_token: result.session.access_token,
              refresh_token: result.session.refresh_token
            })
            
            if (manualError) {
              console.error('❌ Manual session setup failed:', manualError)
            } else if (manualSession.session) {
              console.log('✅ Manual session setup successful:', manualSession.user.email)
              setUser(manualSession.user)
            }
          } catch (manualErr) {
            console.error('💥 Manual session setup error:', manualErr)
          }
        }
      }
      
      return result
    } catch (error) {
      console.error('💥 Sign in error:', error)
      setLoading(false)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email, password, fullName) => {
    try {
      console.log('🚀 Starting sign up for:', email)
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName }),
        credentials: 'include'
      })
      
      const result = await response.json()
      console.log('📡 Register API response:', response.status, result)
      
      if (!response.ok) throw new Error(result.error)
      return result
    } catch (error) {
      console.error('💥 Sign up error:', error)
      throw error
    }
  }

  const signInWithGoogle = async () => {
    try {
      console.log('🚀 Starting Google sign in...')
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`
        }
      })
      if (error) throw error
    } catch (error) {
      console.error('💥 Google sign in error:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      console.log('🚀 Starting sign out...')
      
      // Call our logout API first
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      
      if (!response.ok) {
        const result = await response.json()
        console.error('❌ Logout API failed:', result.error)
        throw new Error(result.error)
      }
      
      // Then sign out from Supabase client
      await supabase.auth.signOut()
      
      // Force state update
      setUser(null)
      console.log('✅ Sign out successful')
    } catch (error) {
      console.error('💥 Sign out error:', error)
      throw error
    }
  }

  // Debug current state
  useEffect(() => {
    if (mounted) {
      console.log('🔍 Current auth state - User:', user?.email || 'none', 'Loading:', loading)
    }
  }, [user, loading, mounted])

  // Prevent hydration issues by not rendering until mounted
  if (!mounted) {
    return null
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      isAuthenticated: !!user
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