import { createSupabaseServerClient } from '@/lib/supabase-server'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // CSRF protection
  const origin = req.headers.origin
  const allowedOrigins = [process.env.NEXT_PUBLIC_SITE_URL, 'http://localhost:3000']
  
  if (!allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: 'Forbidden origin' })
  }

  const supabase = createSupabaseServerClient(req, res)
  const { email, password, fullName } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  // Password strength validation
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' })
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' })
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || email.split('@')[0],
        }
      }
    })

    if (error) {
      console.error('Registration error:', error.message)
      return res.status(400).json({ error: error.message })
    }

    return res.status(200).json({ 
      user: data.user,
      message: 'Registration successful. Please check your email for verification.'
    })
  } catch (error) {
    console.error('Registration server error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}