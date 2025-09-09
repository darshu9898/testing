import { createSupabaseServerClient } from '@/lib/supabase-server'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Add CSRF protection
  const origin = req.headers.origin
  const allowedOrigins = [process.env.NEXT_PUBLIC_SITE_URL, 'http://localhost:3000','https://www.trivedamayurveda.com/','https://vercel.com/darshitas-projects-59fc0df4/ayurveda-tier1/7F93jc92ZKmLPfzH9M2X5s92SHtG','https://www.trivedamayurveda.com']
  
  if (!allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: 'Forbidden origin' })
  }

  const supabase = createSupabaseServerClient(req, res)
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' })
  }

  try {
    console.log('🔐 Server: Attempting login for:', email)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('❌ Server: Login error:', error.message)
      return res.status(401).json({ error: error.message })
    }

    if (!data.session) {
      console.error('❌ Server: No session returned from Supabase')
      return res.status(401).json({ error: 'Login failed - no session created' })
    }

    console.log('✅ Server: Login successful, session created for:', data.user.email)
    console.log('🍪 Server: Session expires at:', new Date(data.session.expires_at * 1000))

    // Verify cookies were set by checking response headers
    const setCookieHeaders = res.getHeader('Set-Cookie')
    console.log('🍪 Server: Set-Cookie headers count:', Array.isArray(setCookieHeaders) ? setCookieHeaders.length : (setCookieHeaders ? 1 : 0))

    // Return success with user data
    return res.status(200).json({ 
      user: data.user,
      session: {
        access_token: data.session.access_token,
        expires_at: data.session.expires_at,
        refresh_token: data.session.refresh_token
      },
      message: 'Login successful'
    })
  } catch (error) {
    console.error('💥 Server: Login server error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}