// src/pages/api/admin/logout.js
import { destroyAdminSession } from '@/lib/adminAuth'

export default async function handler(req, res) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const token = req.headers.authorization?.replace('Bearer ', '') || 
                req.headers['x-admin-token'] ||
                req.body?.adminToken

  try {
    // Destroy session
    destroyAdminSession(token)

    return res.status(200).json({
      success: true,
      message: 'Admin logout successful'
    })

  } catch (error) {
    console.error('Admin logout error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}