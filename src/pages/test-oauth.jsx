// src/pages/test-oauth.js - Simple page to test Google OAuth
import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-client'

export default function TestOAuth() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const supabase = createSupabaseBrowserClient()

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`
        }
      })

      if (error) {
        setResult({ error: error.message })
      } else {
        setResult({ success: 'OAuth initiated - check for redirect' })
      }
    } catch (err) {
      setResult({ error: err.message })
    } finally {
      setLoading(false)
    }
  }

  const checkSession = async () => {
    const { data: { session }, error } = await supabase.auth.getSession()
    setResult({ session, error })
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h1 className = 'text-black'>OAuth Testing Page</h1>
      
      <div style={{ marginBottom: '1rem' }}>
        <button 
          onClick={handleGoogleLogin} 
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: '#4285f4',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Loading...' : 'Sign in with Google'}
        </button>

        <button 
          onClick={checkSession}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#34a853',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Check Current Session
        </button>
      </div>

      {result && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '1rem', 
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
          maxWidth: '600px',
          color: 'black'
        }}>
          <h3>Result:</h3>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div style={{ marginTop: '2rem', fontSize: '14px', color: '#666' }}>
        <h3>Testing Instructions:</h3>
        <ol>
          <li>Click &ldquo;Sign in with Google&rdquo;</li>
          <li>You should be redirected to Google&apos;s consent screen</li>
          <li>After authentication, you&apos;ll be redirected back to your app</li>
          <li>Click &ldquo;Check Current Session&rdquo; to verify login worked</li>
        </ol>
        
        <h3>Expected Flow:</h3>
        <ul>
          <li>→ Google OAuth popup/redirect</li>
          <li>→ User consents</li>
          <li>→ Redirect to /api/auth/callback?code=...</li>
          <li>→ Callback exchanges code for session</li>
          <li>→ User is logged in</li>
        </ul>
      </div>
    </div>
  )
}