import React, { useState } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Tag,
  Receipt,
  Settings,
  Menu,
  X,
  ChefHat,
  Truck,
  Trash2,
  Bell,
  BarChart3,
  Calendar,
  Layers,
  Percent,
  Moon,
  Sun,
  LogOut,
  UserCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
      { label: 'Alerts', path: '/alerts', icon: <Bell size={18} /> },
    ],
  },
  {
    title: 'Sales & Orders',
    items: [
      { label: 'Point of Sale', path: '/sales', icon: <ShoppingCart size={18} /> },
      { label: 'Customers', path: '/customers', icon: <Users size={18} /> },
      { label: 'Sales Reports', path: '/sales-reports', icon: <BarChart3 size={18} /> },
    ],
  },
  {
    title: 'Catalog',
    items: [
      { label: 'Menu Items', path: '/menu', icon: <ChefHat size={18} /> },
      { label: 'Combo Deals', path: '/combos', icon: <Layers size={18} /> },
      { label: 'Subscriptions', path: '/subscriptions', icon: <Receipt size={18} /> },
      { label: 'Discounts', path: '/discounts', icon: <Percent size={18} /> },
      { label: 'Tax Config', path: '/tax-config', icon: <Tag size={18} /> },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Inventory', path: '/inventory', icon: <Package size={18} /> },
      { label: 'Suppliers', path: '/suppliers', icon: <Truck size={18} /> },
      { label: 'Purchase Orders', path: '/purchase-orders', icon: <Receipt size={18} /> },
      { label: 'Delivery Calendar', path: '/delivery-calendar', icon: <Calendar size={18} /> },
      { label: 'Waste Log', path: '/waste-log', icon: <Trash2 size={18} /> },
    ],
  },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { isDark, toggle: toggleDark } = useDarkMode();
  const { identity, clear } = useInternetIdentity();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const isActive = (path: string) => location.pathname === path;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center shadow-green-glow-sm">
          <ChefHat size={20} className="text-white" />
        </div>
        <div>
          <h1 className="font-heading font-bold text-base text-foreground leading-tight">RestaurantOS</h1>
          <p className="text-xs text-muted-foreground">Management Suite</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navSections.map((section) => (
          <div key={section.title}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                      isActive(item.path)
                        ? 'bg-primary-500 text-white shadow-green-glow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <span className={cn(isActive(item.path) ? 'text-white' : 'text-muted-foreground')}>
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-border space-y-1">
        {identity && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent mb-2">
            <UserCircle size={16} className="text-primary-500 shrink-0" />
            <span className="text-xs text-muted-foreground truncate">
              {identity.getPrincipal().toString().slice(0, 12)}...
            </span>
          </div>
        )}
        <button
          onClick={toggleDark}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all w-full"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </button>
        {identity && (
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all w-full"
          >
            <LogOut size={18} />
            Logout
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 lg:hidden',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
              <ChefHat size={16} className="text-white" />
            </div>
            <span className="font-heading font-bold text-sm">RestaurantOS</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </Button>
        </div>
        <div className="flex-1 overflow-hidden">
          <SidebarContent />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary-500 flex items-center justify-center">
              <ChefHat size={14} className="text-white" />
            </div>
            <span className="font-heading font-bold text-sm">RestaurantOS</span>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleDark}>
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
