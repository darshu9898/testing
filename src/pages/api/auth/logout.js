import { createSupabaseServerClient } from '@/lib/supabase-server'
import { clearSession } from '@/lib/session'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabase = createSupabaseServerClient(req, res)

  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Logout error:', error.message)
    }
    
    // Clear guest session as well
    clearSession(res)
    
    return res.status(200).json({ message: 'Logout successful' })
  } catch (error) {
    console.error('Logout server error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
