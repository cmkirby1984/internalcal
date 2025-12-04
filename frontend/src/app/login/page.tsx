'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore, useUIStore } from '@/lib/store';
import { Button, Input, Card } from '@/components/ui';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isLoading, error, clearError } = useAuthStore();
  const showToast = useUIStore((state) => state.showToast);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get redirect URL from query params
  const redirectTo = searchParams.get('from') || '/';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, router, redirectTo]);

  // Handle login error from store
  useEffect(() => {
    if (error) {
      setLoginError(error);
      showToast({ type: 'ERROR', message: error, duration: 5000 });
      clearError();
    }
  }, [error, showToast, clearError]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting || isLoading) return;
    
    // Basic validation
    if (!username.trim() || !password.trim()) {
      setLoginError('Please enter both username and password');
      return;
    }

    setLoginError(null);
    setIsSubmitting(true);

    try {
      await login(username.trim(), password);
      // Success - redirect will happen via useEffect
      showToast({ type: 'SUCCESS', message: 'Login successful!', duration: 2000 });
    } catch (err) {
      // Error handling is done in the store and useEffect above
      console.error('Login failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [username, password, login, isSubmitting, isLoading, showToast]);

  // Clear error when user starts typing
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    if (loginError) setLoginError(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (loginError) setLoginError(null);
  };

  if (isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg-page)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[var(--primary-600)] border-t-transparent rounded-full animate-spin" />
          <p className="text-[var(--text-secondary)]">Redirecting...</p>
        </div>
      </div>
    );
  }

  const buttonDisabled = isLoading || isSubmitting || !username.trim() || !password.trim();

  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--bg-page)] p-4">
      <Card className="w-full max-w-md p-8 shadow-lg">
        <h2 className="text-3xl font-bold text-center text-[var(--text-primary)] mb-2">
          Welcome Back
        </h2>
        <p className="text-center text-[var(--text-muted)] mb-6">
          Sign in to Motel Manager
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-[var(--text-secondary)] mb-2"
            >
              Username
            </label>
            <Input
              id="username"
              name="username"
              type="text"
              value={username}
              onChange={handleUsernameChange}
              placeholder="Enter your username"
              required
              autoComplete="username"
              autoFocus
              className="w-full"
              disabled={isSubmitting}
            />
          </div>
          
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[var(--text-secondary)] mb-2"
            >
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              className="w-full"
              disabled={isSubmitting}
            />
          </div>

          {loginError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm text-center">{loginError}</p>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={buttonDisabled}
          >
            {isLoading || isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        <p className="text-center text-[var(--text-muted)] text-sm mt-6">
          Need help? <a href="#" className="text-[var(--primary-600)] hover:underline">Contact support</a>
        </p>
      </Card>
    </div>
  );
}

// Loading fallback for Suspense
function LoginLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--bg-page)]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-[var(--primary-600)] border-t-transparent rounded-full animate-spin" />
        <p className="text-[var(--text-secondary)]">Loading...</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
}
