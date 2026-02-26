import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Leaf, Loader2, ShieldCheck, Salad } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const { login, loginStatus, identity, isInitializing, isLoggingIn } = useInternetIdentity();
  const navigate = useNavigate();

  useEffect(() => {
    if (identity) {
      navigate({ to: '/dashboard' });
    }
  }, [identity, navigate]);

  const handleLogin = () => {
    try {
      login();
    } catch (error: unknown) {
      console.error('Login error:', error);
    }
  };

  const isLoading = isInitializing || isLoggingIn;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-secondary/30 blur-3xl" />
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Logo & Brand */}
        <div className="flex flex-col items-center mb-10 animate-fade-in">
          <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-green mb-4 bg-primary/10 flex items-center justify-center">
            <img
              src="/assets/generated/logo.dim_256x256.png"
              alt="Salad Khatora"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  const span = document.createElement('span');
                  span.textContent = '🥗';
                  span.className = 'text-4xl';
                  parent.appendChild(span);
                }
              }}
            />
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground tracking-tight">Salad Khatora</h1>
          <p className="text-muted-foreground text-sm mt-1 font-medium">Kitchen Inventory Manager</p>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-sm animate-fade-in">
          <div className="bg-card rounded-2xl border border-border shadow-card p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-secondary mb-3">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <h2 className="font-heading text-xl font-bold text-foreground">Admin Login</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Sign in to manage your kitchen inventory
              </p>
            </div>

            {loginStatus === 'loginError' && (
              <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
                Login failed. Please try again.
              </div>
            )}

            <Button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full h-12 text-base font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-green transition-all duration-200"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isInitializing ? 'Initializing...' : 'Signing in...'}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Leaf className="w-4 h-4" />
                  Sign in with Internet Identity
                </span>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground mt-4">
              Secure, decentralized authentication powered by the Internet Computer
            </p>
          </div>

          {/* Features */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { icon: '📦', label: 'Inventory Tracking' },
              { icon: '⚠️', label: 'Low Stock Alerts' },
              { icon: '📊', label: 'Live Dashboard' },
            ].map(({ icon, label }) => (
              <div key={label} className="bg-card rounded-xl border border-border p-3 text-center shadow-xs">
                <div className="text-xl mb-1">{icon}</div>
                <div className="text-xs text-muted-foreground font-medium leading-tight">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative border-t border-border py-4 px-4">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Salad Khatora.</span>
          <span className="flex items-center gap-1">
            Built with <span className="text-primary">♥</span> using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'salad-khatora')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              caffeine.ai
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
