import { createSupabaseBrowserClient } from '@/lib/supabase-client'
import { useState, useEffect, createContext, useContext } from 'react'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null)
        setLoading(false)
        
        // Merge guest cart when user signs in
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            await fetch('/api/cart/merge', {
              method: 'POST',
              credentials: 'include'
            })
          } catch (error) {
            console.error('Cart merge failed:', error)
          }
        }
      }
    )

    return () => subscription?.unsubscribe()
  }, [supabase])

  const signIn = async (email, password) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    })
    
    const result = await response.json()
    if (!response.ok) throw new Error(result.error)
    return result
  }

  const signUp = async (email, password, fullName) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName }),
      credentials: 'include'
    })
    
    const result = await response.json()
    if (!response.ok) throw new Error(result.error)
    return result
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`
      }
    })
    if (error) throw error
  }

  const signOut = async () => {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    })
    
    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.error)
    }
    
    // Also sign out from Supabase client
    await supabase.auth.signOut()
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
