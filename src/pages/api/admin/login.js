// src/pages/api/admin/login.js
import { validateAdminCredentials, createAdminSession } from '@/lib/adminAuth'

export default async function handler(req, res) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { adminId, adminPassword } = req.body

  // Validation
  if (!adminId || !adminPassword) {
    return res.status(400).json({ 
      error: 'Admin ID and password are required' 
    })
  }

  try {
    // Validate credentials
    if (!validateAdminCredentials(adminId, adminPassword)) {
      return res.status(401).json({ 
        error: 'Invalid admin credentials' 
      })
    }

    // Create session
    const session = createAdminSession()

    return res.status(200).json({
      success: true,
      message: 'Admin login successful',
      token: session.token,
      expiresAt: session.expiresAt
    })

  } catch (error) {
    console.error('Admin login error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}