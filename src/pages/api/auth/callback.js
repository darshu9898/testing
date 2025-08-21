import { createSupabaseServerClient } from '@/lib/supabase-server'

export default async function handler(req, res) {
  const { code } = req.query

  if (!code) {
    console.error('No auth code provided in callback')
    return res.redirect('/login?error=no_code')
  }

  const supabase = createSupabaseServerClient(req, res)

  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('OAuth callback error:', error.message)
      return res.redirect('/login?error=oauth_error')
    }

    // Successful OAuth login - redirect to dashboard
    return res.redirect('/')
  } catch (error) {
    console.error('Callback processing error:', error)
    return res.redirect('/login?error=callback_error')
  }
}
