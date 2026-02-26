import React, { useState } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import {
  LayoutDashboard,
  Package,
  UtensilsCrossed,
  ShoppingCart,
  Users,
  Bell,
  Truck,
  ClipboardList,
  Trash2,
  Gift,
  Percent,
  Receipt,
  BarChart3,
  Settings,
  Menu,
  X,
  ChefHat,
  LogOut,
  UserCircle,
  Shield,
  Activity,
  Sun,
  Moon,
} from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { useAlerts } from '../hooks/useQueries';
import { useDarkMode } from '../hooks/useDarkMode';
import { Button } from '@/components/ui/button';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const mainNavItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: 'Inventory', path: '/inventory', icon: <Package className="w-4 h-4" /> },
  { label: 'Menu', path: '/menu', icon: <UtensilsCrossed className="w-4 h-4" /> },
  { label: 'Combos', path: '/combos', icon: <Gift className="w-4 h-4" /> },
  { label: 'Sales', path: '/sales', icon: <ShoppingCart className="w-4 h-4" /> },
  { label: 'Sales Reports', path: '/sales-reports', icon: <BarChart3 className="w-4 h-4" /> },
  { label: 'Customers', path: '/customers', icon: <Users className="w-4 h-4" /> },
  { label: 'Suppliers', path: '/suppliers', icon: <Truck className="w-4 h-4" /> },
  { label: 'Purchase Orders', path: '/purchase-orders', icon: <ClipboardList className="w-4 h-4" /> },
  { label: 'Waste Log', path: '/waste-log', icon: <Trash2 className="w-4 h-4" /> },
  { label: 'Discount Codes', path: '/discounts', icon: <Percent className="w-4 h-4" /> },
  { label: 'Tax Config', path: '/tax-config', icon: <Receipt className="w-4 h-4" /> },
  { label: 'Alerts', path: '/alerts', icon: <Bell className="w-4 h-4" /> },
];

const adminNavItems: NavItem[] = [
  { label: 'Staff Accounts', path: '/staff', icon: <Shield className="w-4 h-4" /> },
  { label: 'Activity Log', path: '/audit-log', icon: <Activity className="w-4 h-4" /> },
  { label: 'Admin Settings', path: '/admin-settings', icon: <Settings className="w-4 h-4" /> },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { identity, clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: alerts } = useAlerts();
  const { isDark, toggle: toggleDark } = useDarkMode();
  const [mobileOpen, setMobileOpen] = useState(false);

  const unreadCount = (alerts ?? []).filter((a: any) => !a.isRead).length;

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const isActive = (path: string) => location.pathname === path;

  const NavLink = ({ item }: { item: NavItem }) => (
    <Link
      to={item.path}
      onClick={() => setMobileOpen(false)}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive(item.path)
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
      }`}
    >
      {item.icon}
      {item.label}
      {item.path === '/alerts' && unreadCount > 0 && (
        <span className="ml-auto bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <ChefHat className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="font-bold text-lg text-foreground">KitchenOS</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {mainNavItems.map(item => (
          <NavLink key={item.path} item={item} />
        ))}

        {/* Admin Section */}
        <div className="pt-4">
          <p className="px-3 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Admin</p>
          {adminNavItems.map(item => (
            <NavLink key={item.path} item={item} />
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-border space-y-2">
        {identity && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted">
            <UserCircle className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground truncate">
              {identity.getPrincipal().toString().slice(0, 12)}...
            </span>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-card border-r border-border z-10">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
          <button
            className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden md:block" />

          <div className="flex items-center gap-2">
            {/* Dark mode toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDark}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="rounded-lg"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>

            {mobileOpen && (
              <button
                className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        {/* Footer */}
        <footer className="px-6 py-3 border-t border-border bg-card text-center text-xs text-muted-foreground shrink-0">
          © {new Date().getFullYear()} KitchenOS — Built with{' '}
          <span className="text-red-500">♥</span> using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </footer>
      </div>
    </div>
  );
}
