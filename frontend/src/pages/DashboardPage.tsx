import React from 'react';
import { RefreshCw, TrendingUp, ShoppingCart, Package, AlertTriangle, DollarSign, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useIngredients, useSalesStats } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export default function DashboardPage() {
  const queryClient = useQueryClient();

  const { data: ingredients = [] } = useIngredients();
  const { data: salesStats, isLoading: salesLoading } = useSalesStats();

  const totalIngredients = ingredients.length;
  const totalInventoryValue = ingredients.reduce((sum, i) => sum + i.quantity * i.costPrice, 0);
  const lowStockItems = ingredients.filter(i => i.quantity <= i.lowStockThreshold).length;

  const handleRefresh = () => {
    queryClient.invalidateQueries();
  };

  const stats = [
    {
      title: 'Total Revenue',
      value: salesLoading ? '...' : formatCurrency(salesStats?.totalRevenue ?? 0),
      icon: <DollarSign className="w-5 h-5" />,
      sub: `${salesStats?.totalOrders ?? 0} orders total`,
      color: 'text-green-600',
    },
    {
      title: 'Avg Order Value',
      value: salesLoading ? '...' : formatCurrency(salesStats?.avgOrderValue ?? 0),
      icon: <TrendingUp className="w-5 h-5" />,
      sub: 'Per order average',
      color: 'text-blue-600',
    },
    {
      title: 'Total Orders',
      value: salesLoading ? '...' : String(salesStats?.totalOrders ?? 0),
      icon: <ShoppingCart className="w-5 h-5" />,
      sub: 'All time',
      color: 'text-purple-600',
    },
    {
      title: 'Inventory Items',
      value: String(totalIngredients),
      icon: <Package className="w-5 h-5" />,
      sub: `${formatCurrency(totalInventoryValue)} total value`,
      color: 'text-orange-600',
    },
    {
      title: 'Low Stock Alerts',
      value: String(lowStockItems),
      icon: <AlertTriangle className="w-5 h-5" />,
      sub: lowStockItems > 0 ? 'Needs attention' : 'All good',
      color: lowStockItems > 0 ? 'text-red-600' : 'text-green-600',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Here's what's happening in your kitchen today.</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.map(stat => (
          <Card key={stat.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                {stat.title}
                <span className={stat.color}>{stat.icon}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {lowStockItems > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
              <div>
                <p className="text-sm font-medium text-destructive">Low Stock Warning</p>
                <p className="text-xs text-muted-foreground">
                  {lowStockItems} ingredient{lowStockItems !== 1 ? 's are' : ' is'} running low. Check the Inventory page.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {salesLoading && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading sales data...
        </div>
      )}
    </div>
  );
}
