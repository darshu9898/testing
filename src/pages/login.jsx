import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { useAuth } from '@/hooks/useAuth';
import { ButtonDemo } from '@/components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn, signInWithGoogle, user } = useAuth();
  const router = useRouter();
  const { redirect, error: urlError } = router.query;

  // Handle URL error params
  useEffect(() => {
    if (urlError) {
      switch (urlError) {
        case 'no_code':
          setError('OAuth authentication failed. Please try again.');
          break;
        case 'oauth_error':
          setError('OAuth login failed. Please try again.');
          break;
        case 'callback_error':
          setError('Authentication callback failed. Please try again.');
          break;
        default:
          setError('An authentication error occurred. Please try again.');
      }
    }
  }, [urlError]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const redirectTo = redirect && typeof redirect === 'string' ? redirect : '/';
      router.push(redirectTo);
    }
  }, [user, router, redirect]);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔐 Login: Attempting login for:', email);
      
      const result = await signIn(email, password);
      
      if (result.success) {
        console.log('✅ Login: Login successful');
        const redirectTo = redirect && typeof redirect === 'string' ? redirect : '/';
        router.push(redirectTo);
      } else {
        console.log('❌ Login: Login failed:', result.error);
        setError(result.error || 'Login failed');
        setLoading(false);
      }
    } catch (error) {
      console.error('💥 Login: Unexpected error:', error);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      await signInWithGoogle();
      // Redirect is handled by the callback
    } catch (error) {
      setError(error.message);
    }
  };

  if (user) {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#2F674A]"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Login - Trivedam</title>
        <meta name="description" content="Sign in to your Trivedam account" />
      </Head>
      
      <div className="pt-16 min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="max-w-md w-full bg-white">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-[#2F674A]">
              Welcome Back
            </CardTitle>
            <p className="text-gray-600 mt-2">Sign in to your account</p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Email Login Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="text-black w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F674A] focus:border-transparent"
                  placeholder="your@email.com"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="text-black w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F674A] focus:border-transparent"
                  placeholder="Your password"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-[#2F674A] text-white hover:bg-green-700 rounded cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </form>

            {!loading && (
              <>
                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>

                {/* Google Login */}
                <button
                  onClick={handleGoogleLogin}
                  className="w-full px-4 py-2 bg-white text-black hover:bg-gray-200 border border-gray-300 rounded cursor-pointer transition-colors"
                >
                  Continue with Google
                </button>

                {/* Sign Up Link */}
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{' '}
                    <Link href="/register" className="font-medium text-[#2F674A] hover:underline">
                      Sign up here
                    </Link>
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}