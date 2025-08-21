import { createSupabaseServerClient } from '@/lib/supabase-server'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Add CSRF protection
  const origin = req.headers.origin
  const allowedOrigins = [process.env.NEXT_PUBLIC_SITE_URL, 'http://localhost:3000']
  
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
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Login error:', error.message)
      return res.status(401).json({ error: error.message })
    }

    // Cookies are automatically set by Supabase client via our cookie handlers
    return res.status(200).json({ 
      user: data.user,
      message: 'Login successful'
    })
  } catch (error) {
    console.error('Login server error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}