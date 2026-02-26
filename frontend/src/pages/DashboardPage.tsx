import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useIngredients,
  useGetCallerUserProfile,
  useSalesStats,
} from '../hooks/useQueries';
import { Package, TrendingUp, AlertTriangle, RefreshCw, Leaf, DollarSign, ShoppingBag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ProfileSetupModal from '../components/ProfileSetupModal';
import { cn } from '@/lib/utils';
import type { Ingredient } from '../backend';

export default function DashboardPage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();

  const { data: ingredients, isLoading: ingredientsLoading, error: ingredientsError, refetch: refetchIngredients } = useIngredients();
  const { data: userProfile, isLoading: profileLoading, isFetched: profileFetched } = useGetCallerUserProfile();
  const { data: salesStats, isLoading: salesStatsLoading, refetch: refetchSalesStats } = useSalesStats();

  useEffect(() => {
    if (!identity) {
      navigate({ to: '/login' });
    }
  }, [identity, navigate]);

  const handleRefresh = () => {
    refetchIngredients();
    refetchSalesStats();
  };

  const showProfileSetup = !!identity && !profileLoading && profileFetched && userProfile === null;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(value);

  // Compute stats from ingredients
  const totalIngredients = ingredients?.length ?? 0;
  const totalInventoryValue = ingredients?.reduce((sum, i) => sum + i.quantity * i.costPrice, 0) ?? 0;
  const lowStockItems: Ingredient[] = (ingredients ?? []).filter(i => i.quantity <= i.lowStockThreshold);
  const lowStockCount = lowStockItems.length;

  const statsLoading = ingredientsLoading;

  const inventoryStatCards = [
    {
      title: 'Total Ingredients',
      value: statsLoading ? null : totalIngredients,
      icon: Package,
      color: 'text-primary',
      bg: 'bg-secondary',
      format: (v: number) => v.toString(),
      alert: false,
    },
    {
      title: 'Total Inventory Value',
      value: statsLoading ? null : totalInventoryValue,
      icon: TrendingUp,
      color: 'text-primary',
      bg: 'bg-secondary',
      format: (v: number) => formatCurrency(v),
      alert: false,
    },
    {
      title: 'Low Stock Items',
      value: statsLoading ? null : lowStockCount,
      icon: AlertTriangle,
      color: lowStockCount > 0 ? 'text-warning' : 'text-primary',
      bg: lowStockCount > 0 ? 'bg-warning/10' : 'bg-secondary',
      format: (v: number) => v.toString(),
      alert: lowStockCount > 0,
    },
  ];

  const salesStatCards = [
    {
      title: 'Total Revenue',
      value: salesStatsLoading ? null : (salesStats?.totalRevenue ?? 0),
      icon: DollarSign,
      color: 'text-primary',
      bg: 'bg-secondary',
      format: (v: number) => formatCurrency(v),
    },
    {
      title: 'Orders Today',
      value: salesStatsLoading ? null : Number(salesStats?.todaysOrdersCount ?? 0),
      icon: ShoppingBag,
      color: 'text-primary',
      bg: 'bg-secondary',
      format: (v: number) => v.toString(),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {showProfileSetup && <ProfileSetupModal />}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            {userProfile ? `Welcome back, ${userProfile.name}! 👋` : 'Dashboard'}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Here's an overview of your kitchen inventory & sales
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="self-start sm:self-auto flex items-center gap-2 border-border hover:bg-accent"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Sales Stats */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Sales Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {salesStatCards.map(({ title, value, icon: Icon, color, bg, format }) => (
            <Card key={title} className="border-border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    {salesStatsLoading || value === null ? (
                      <Skeleton className="h-8 w-24 mt-1" />
                    ) : (
                      <p className={cn('text-2xl font-bold font-heading mt-1', color)}>
                        {format(value)}
                      </p>
                    )}
                  </div>
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', bg)}>
                    <Icon className={cn('w-5 h-5', color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Inventory Stats Cards */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Inventory Overview</h2>
        {ingredientsError ? (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            Failed to load stats. You may not have admin access yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {inventoryStatCards.map(({ title, value, icon: Icon, color, bg, format, alert }) => (
              <Card key={title} className={cn('border-border shadow-sm hover:shadow-md transition-shadow', alert && 'border-warning/40')}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">{title}</p>
                      {statsLoading || value === null ? (
                        <Skeleton className="h-8 w-24 mt-1" />
                      ) : (
                        <p className={cn('text-2xl font-bold font-heading mt-1', color)}>
                          {format(value)}
                        </p>
                      )}
                    </div>
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', bg)}>
                      <Icon className={cn('w-5 h-5', color)} />
                    </div>
                  </div>
                  {alert && (
                    <div className="mt-3 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
                      <span className="text-xs text-warning font-medium">Needs attention</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Low Stock Alerts */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-warning" />
              </div>
              <div>
                <CardTitle className="text-base font-heading font-semibold">Low Stock Alerts</CardTitle>
                <CardDescription className="text-xs">Items at or below their threshold</CardDescription>
              </div>
            </div>
            {!statsLoading && lowStockCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {lowStockCount} item{lowStockCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : lowStockItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-3">
                <Leaf className="w-6 h-6 text-primary" />
              </div>
              <p className="font-medium text-foreground text-sm">All stocked up!</p>
              <p className="text-muted-foreground text-xs mt-1">No items are running low right now.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lowStockItems.map((item) => (
                <div
                  key={item.id.toString()}
                  className="flex items-center justify-between p-3 rounded-xl bg-warning/5 border border-warning/20 hover:bg-warning/10 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-2 h-2 rounded-full bg-warning flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Cost: ₹{item.costPrice.toFixed(2)}/{item.unit}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-warning">
                        {item.quantity} {item.unit}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Threshold: {item.lowStockThreshold} {item.unit}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
