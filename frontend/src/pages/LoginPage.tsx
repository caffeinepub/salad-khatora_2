import React, { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { ChefHat, Loader2, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const { login, clear, loginStatus, identity, isInitializing, isLoginError, isLoggingIn } = useInternetIdentity();
  const navigate = useNavigate();

  const isAuthenticated = !!identity;

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: '/dashboard' });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      if (error?.message === 'User is already authenticated') {
        await clear();
        setTimeout(() => login(), 300);
      }
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
          {/* Header Banner */}
          <div className="bg-primary-500 px-8 py-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
              <ChefHat size={32} className="text-white" />
            </div>
            <h1 className="font-heading font-bold text-2xl text-white">RestaurantOS</h1>
            <p className="text-white/80 text-sm mt-1">Management Suite</p>
          </div>

          {/* Body */}
          <div className="px-8 py-8">
            <h2 className="font-heading font-semibold text-xl text-foreground text-center mb-2">
              Welcome Back
            </h2>
            <p className="text-muted-foreground text-sm text-center mb-8">
              Sign in to access your restaurant management dashboard.
            </p>

            <Button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 rounded-xl transition-all shadow-green-glow-sm"
              size="lg"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={18} className="mr-2" />
                  Sign In with Internet Identity
                </>
              )}
            </Button>

            {isLoginError && (
              <p className="mt-4 text-sm text-destructive text-center">
                Login failed. Please try again.
              </p>
            )}

            <p className="mt-6 text-xs text-muted-foreground text-center">
              Secure authentication powered by Internet Identity
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Built with ❤️ using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-500 hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
