// src/pages/api/admin/login.js
import { validateAdminCredentials, createAdminSession } from '@/lib/adminAuth'

export default async function handler(req, res) {
  console.log(`📥 Admin login request: ${req.method} ${req.url}`)

  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { adminId, adminPassword } = req.body || {}

  console.log('📝 Login attempt:', {
    adminId,
    hasPassword: !!adminPassword,
    passwordLength: adminPassword?.length
  })

  // Validation
  if (!adminId || !adminPassword) {
    console.log('❌ Missing credentials')
    return res.status(400).json({
      error: 'Admin ID and password are required'
    })
  }

  try {
    // Validate credentials
    if (!validateAdminCredentials(adminId, adminPassword)) {
      console.log('❌ Invalid credentials provided')
      return res.status(401).json({
        error: 'Invalid admin credentials'
      })
    }

    // IMPORTANT: await session creation
    const session = await createAdminSession()

    if (!session || !session.token) {
      console.error('💥 createAdminSession returned no token:', session)
      return res.status(500).json({ error: 'Failed to create admin session' })
    }

    const { token, expiresAt } = session

    console.log('✅ Admin login successful - returning token prefix:', token.substring(0, 8))

    // Set HttpOnly cookie (optional but useful). Max-Age in seconds.
    try {
      const maxAgeSeconds = Math.round((new Date(expiresAt).getTime() - Date.now()) / 1000)
      // Use a simple Set-Cookie header; If you use cookie library, adapt accordingly
      res.setHeader('Set-Cookie', `admin_token=${token}; HttpOnly; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`)
    } catch (cookieErr) {
      console.warn('Could not set cookie for admin session:', cookieErr)
    }

    // Return token and ISO expiry so client can store it if needed
    return res.status(200).json({
      success: true,
      message: 'Admin login successful',
      token,
      expiresAt: new Date(expiresAt).toISOString()
    })

  } catch (error) {
    console.error('💥 Admin login error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
