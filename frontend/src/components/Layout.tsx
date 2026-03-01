import { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  UtensilsCrossed,
  Users,
  Layers,
  Truck,
  ClipboardList,
  CalendarDays,
  Tag,
  Receipt,
  UserCog,
  Trash2,
  Bell,
  BarChart2,
  ScrollText,
  Settings,
  Menu,
  X,
  Leaf,
  Heart,
} from "lucide-react";
import { useDarkMode } from "../hooks/useDarkMode";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
    title: "Overview",
    items: [
      { label: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={18} /> },
      { label: "Alerts", path: "/alerts", icon: <Bell size={18} /> },
      { label: "Sales Reports", path: "/sales-reports", icon: <BarChart2 size={18} /> },
    ],
  },
  {
    title: "Sales & Orders",
    items: [
      { label: "Point of Sale", path: "/sales", icon: <ShoppingCart size={18} /> },
      { label: "Customers", path: "/customers", icon: <Users size={18} /> },
      { label: "Subscriptions", path: "/subscriptions", icon: <CalendarDays size={18} /> },
      { label: "Delivery Calendar", path: "/delivery-calendar", icon: <CalendarDays size={18} /> },
    ],
  },
  {
    title: "Catalog",
    items: [
      { label: "Menu Items", path: "/menu", icon: <UtensilsCrossed size={18} /> },
      { label: "Combo Deals", path: "/combos", icon: <Layers size={18} /> },
      { label: "Discounts", path: "/discounts", icon: <Tag size={18} /> },
      { label: "Tax Config", path: "/tax-config", icon: <Receipt size={18} /> },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Inventory", path: "/inventory", icon: <Package size={18} /> },
      { label: "Suppliers", path: "/suppliers", icon: <Truck size={18} /> },
      { label: "Purchase Orders", path: "/purchase-orders", icon: <ClipboardList size={18} /> },
      { label: "Waste Log", path: "/waste-log", icon: <Trash2 size={18} /> },
      { label: "Staff Accounts", path: "/staff-accounts", icon: <UserCog size={18} /> },
      { label: "Activity Log", path: "/audit-log", icon: <ScrollText size={18} /> },
      { label: "Admin Settings", path: "/admin-settings", icon: <Settings size={18} /> },
    ],
  },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isDark, toggle: toggleDark } = useDarkMode();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Leaf size={16} className="text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-heading font-bold text-sm text-foreground leading-tight">Salad Khatora</h1>
          <p className="text-xs text-muted-foreground">POS System</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {navSections.map((section) => (
          <div key={section.title} className="mb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">
              {section.title}
            </p>
            {section.items.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 px-2 py-2 rounded-md text-sm font-medium transition-colors mb-0.5",
                  isActive(item.path)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border">
        <button
          onClick={toggleDark}
          className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
        >
          {isDark ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
        <p className="text-center text-xs text-muted-foreground mt-2">
          Built with <Heart size={10} className="inline text-red-500" /> using{" "}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || "salad-khatora-pos")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 border-r border-border bg-card shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-56 bg-card border-r border-border flex flex-col transition-transform duration-200 lg:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Leaf size={14} className="text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-sm">Salad Khatora</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="shrink-0">
            <Menu size={20} />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Leaf size={12} className="text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-sm">Salad Khatora</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
