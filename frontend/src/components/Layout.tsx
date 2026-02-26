import { useState } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { LayoutDashboard, Package, Menu, X, LogOut, ChevronRight, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/inventory', label: 'Inventory', icon: Package },
];

export default function Layout({ children }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { clear, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const location = useLocation();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 shadow-xs">
                <img
                  src="/assets/generated/logo.dim_256x256.png"
                  alt="Salad Khatora"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.classList.add('bg-primary', 'flex', 'items-center', 'justify-center');
                      const icon = document.createElement('span');
                      icon.innerHTML = '🥗';
                      icon.className = 'text-lg';
                      parent.appendChild(icon);
                    }
                  }}
                />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-heading font-800 text-base text-foreground tracking-tight">Salad Khatora</span>
                <span className="text-[10px] text-muted-foreground font-medium tracking-wide uppercase">Kitchen Manager</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                    isActive(path)
                      ? 'bg-primary text-primary-foreground shadow-green'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {identity && (
                <div className="hidden sm:flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary rounded-full">
                    <Leaf className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-medium text-secondary-foreground">Admin</span>
                  </div>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="hidden md:flex items-center gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>

              {/* Mobile menu button */}
              <button
                className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card animate-fade-in">
            <div className="px-4 py-3 space-y-1">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all',
                    isActive(path)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-accent'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    {label}
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </Link>
              ))}
              <div className="pt-2 border-t border-border mt-2">
                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} Salad Khatora. All rights reserved.</span>
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
        </div>
      </footer>
    </div>
  );
}
