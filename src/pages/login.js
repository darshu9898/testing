// pages/login.js
import { supabase } from '../lib/supabaseClient'

export default function Login() {
  const signInWithEmail = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'yourpassword',
    })
    console.log(data, error)
  }

  const signUpWithEmail = async () => {
    const { data, error } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'yourpassword',
    })
    console.log(data, error)
  }

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    })
    console.log(data, error)
  }

  return (
    <div>
      <button onClick={signUpWithEmail}>Sign Up (Email)</button>
      <button onClick={signInWithEmail}>Sign In (Email)</button>
      <button onClick={signInWithGoogle}>Sign In with Google</button>
    </div>
  )
}
