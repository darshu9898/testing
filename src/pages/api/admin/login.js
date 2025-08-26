// 2. Enhanced admin login API - src/pages/api/admin/login.js
// src/pages/api/admin/login.js
import { validateAdminCredentials, createAdminSession } from '@/lib/adminAuth'

export default async function handler(req, res) {
  console.log(`📥 Admin login request: ${req.method} ${req.url}`)
  
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { adminId, adminPassword } = req.body
  
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

    // Create session
    const session = createAdminSession()
    
    console.log('✅ Admin login successful')

    return res.status(200).json({
      success: true,
      message: 'Admin login successful',
      token: session.token,
      expiresAt: session.expiresAt
    })

  } catch (error) {
    console.error('💥 Admin login error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}