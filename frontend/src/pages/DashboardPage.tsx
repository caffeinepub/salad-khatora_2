import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useActor } from '@/hooks/useActor';
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Package,
  AlertTriangle,
  ChefHat,
  ArrowUpRight,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from '@tanstack/react-router';
import { SaleOrder } from '@/backend';

interface SalesStats {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
}

function useSalesStats() {
  const { actor, isFetching } = useActor();
  return useQuery<SalesStats>({
    queryKey: ['salesStats'],
    queryFn: async () => {
      if (!actor) return { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 };
      const orders: SaleOrder[] = await actor.getSaleOrders();
      const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
      const totalOrders = orders.length;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      return { totalRevenue, totalOrders, avgOrderValue };
    },
    enabled: !!actor && !isFetching,
  });
}

function useRecentOrders() {
  const { actor, isFetching } = useActor();
  return useQuery<SaleOrder[]>({
    queryKey: ['saleOrders'],
    queryFn: async () => {
      if (!actor) return [];
      const orders = await actor.getSaleOrders();
      return [...orders].sort((a, b) => Number(b.createdAt) - Number(a.createdAt)).slice(0, 5);
    },
    enabled: !!actor && !isFetching,
  });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
}

function formatDate(timestamp: bigint) {
  return new Date(Number(timestamp) / 1_000_000).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getPaymentLabel(mode: SaleOrder['paymentType']): string {
  if (mode.__kind__ === 'cash') return 'Cash';
  if (mode.__kind__ === 'card') return 'Card';
  if (mode.__kind__ === 'upi') return 'UPI';
  if (mode.__kind__ === 'other') return mode.other;
  return 'Unknown';
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useSalesStats();
  const { data: recentOrders, isLoading: ordersLoading } = useRecentOrders();

  const statCards = [
    {
      title: 'Total Revenue',
      value: stats ? formatCurrency(stats.totalRevenue) : '—',
      icon: <DollarSign size={20} className="text-primary-500" />,
      bg: 'bg-primary-50',
    },
    {
      title: 'Total Orders',
      value: stats ? stats.totalOrders.toString() : '—',
      icon: <ShoppingBag size={20} className="text-primary-500" />,
      bg: 'bg-primary-50',
    },
    {
      title: 'Avg Order Value',
      value: stats ? formatCurrency(stats.avgOrderValue) : '—',
      icon: <TrendingUp size={20} className="text-primary-500" />,
      bg: 'bg-primary-50',
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link
          to="/sales"
          className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-green-glow-sm"
        >
          <ShoppingBag size={16} />
          New Sale
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <Card key={card.title} className="border border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center`}>
                  {card.icon}
                </div>
              </div>
              {statsLoading ? (
                <Loader2 size={20} className="animate-spin text-primary-500" />
              ) : (
                <p className="font-heading font-bold text-2xl text-foreground">{card.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Orders */}
      <Card className="border border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="font-heading text-base font-semibold">Recent Orders</CardTitle>
          <Link
            to="/sales-reports"
            className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-600 font-medium"
          >
            View All <ArrowUpRight size={14} />
          </Link>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-primary-500" />
            </div>
          ) : !recentOrders || recentOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingBag size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id.toString()}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">Order #{order.id.toString()}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      {getPaymentLabel(order.paymentType)}
                    </Badge>
                    <span className="font-semibold text-sm text-foreground">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Inventory', path: '/inventory', icon: <Package size={20} />, desc: 'Manage stock' },
          { label: 'Menu Items', path: '/menu', icon: <ChefHat size={20} />, desc: 'Update menu' },
          { label: 'Customers', path: '/customers', icon: <ShoppingBag size={20} />, desc: 'View customers' },
          { label: 'Alerts', path: '/alerts', icon: <AlertTriangle size={20} />, desc: 'Check alerts' },
        ].map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card hover:bg-accent hover:border-primary-200 transition-all text-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-500 group-hover:bg-primary-100 transition-colors">
              {item.icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-muted-foreground pt-4 pb-2">
        © {new Date().getFullYear()} RestaurantOS · Built with ❤️ using{' '}
        <a
          href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-500 hover:underline"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
