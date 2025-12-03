'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useUIStore } from '@/lib/store';
import { Button, Input, Card } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading, error, clearError } = useAuthStore();
  const showToast = useUIStore((state) => state.showToast);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  // Handle login error from store
  useEffect(() => {
    if (error) {
      setLoginError(error);
      showToast({ type: 'ERROR', message: error, duration: 5000 });
      clearError(); // Clear error after showing toast
    }
  }, [error, showToast, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null); // Clear previous errors
    try {
      await login(username, password);
      // Login successful, useEffect will handle redirection
    } catch (err) {
      // Error is already set in store and handled by useEffect
      console.error('Login submission error:', err);
    }
  };

  if (isAuthenticated) {
    return null; // Don't render anything if already authenticated, wait for redirect
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--bg-page)] p-4">
      <Card className="w-full max-w-md p-8 shadow-lg">
        <h2 className="text-3xl font-bold text-center text-[var(--text-primary)] mb-6">
          Welcome to Motel Manager
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-[var(--text-secondary)] mb-2"
            >
              Username
            </label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              className="w-full"
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
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
          {loginError && (
            <p className="text-red-500 text-sm text-center mt-4">{loginError}</p>
          )}
        </form>
        <p className="text-center text-[var(--text-muted)] text-sm mt-6">
          Don't have an account? <a href="#" className="text-[var(--primary-600)] hover:underline">Contact support</a>
        </p>
      </Card>
    </div>
  );
}
