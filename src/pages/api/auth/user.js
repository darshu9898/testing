import { getContext } from '@/lib/getContext'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { user, userId, isAuthenticated } = await getContext(req, res)

    if (!isAuthenticated) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    return res.status(200).json({ 
      user,
      userId,
      isAuthenticated: true
    })
  } catch (error) {
    console.error('User fetch error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
