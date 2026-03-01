import React from 'react';
import { TrendingUp, ShoppingBag, DollarSign, BarChart2 } from 'lucide-react';
import { useSalesReport, useMenuItems, useIngredients } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function formatCurrency(amount: number) {
  return `₹${amount.toFixed(2)}`;
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  description?: string;
}

function StatCard({ title, value, icon, description }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="text-primary">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: report = [], isLoading: statsLoading } = useSalesReport('daily');
  const { data: menuItems = [], isLoading: menuLoading } = useMenuItems();
  const { data: ingredients = [], isLoading: ingredientsLoading } = useIngredients();

  // Aggregate stats from report entries
  const totalRevenue = report.reduce((sum, r) => sum + r.revenue, 0);
  const totalOrders = report.reduce((sum, r) => sum + r.orders, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const availableItems = menuItems.filter(m => m.isAvailable).length;
  const lowStockCount = ingredients.filter(
    i => i.quantity <= (i.minStockLevel ?? 0)
  ).length;

  const isLoading = statsLoading || menuLoading || ingredientsLoading;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your restaurant's performance (last 7 days).</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue (7d)"
          value={formatCurrency(totalRevenue)}
          icon={<DollarSign className="h-5 w-5" />}
          description="Last 7 days"
        />
        <StatCard
          title="Total Orders (7d)"
          value={String(totalOrders)}
          icon={<ShoppingBag className="h-5 w-5" />}
          description="Last 7 days"
        />
        <StatCard
          title="Avg Order Value"
          value={formatCurrency(avgOrderValue)}
          icon={<TrendingUp className="h-5 w-5" />}
          description="Last 7 days"
        />
        <StatCard
          title="Menu Items"
          value={`${availableItems} / ${menuItems.length}`}
          icon={<BarChart2 className="h-5 w-5" />}
          description={lowStockCount > 0 ? `${lowStockCount} low stock` : 'Stock OK'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Sales (7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            {report.length === 0 ? (
              <p className="text-muted-foreground text-sm">No sales data available.</p>
            ) : (
              <div className="space-y-2">
                {report.slice(-7).map(entry => (
                  <div key={entry.date} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{entry.date}</span>
                    <div className="flex gap-4">
                      <span>{entry.orders} orders</span>
                      <span className="font-medium text-primary">{formatCurrency(entry.revenue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inventory Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Ingredients</span>
                <span className="font-medium">{ingredients.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Low Stock Items</span>
                <span className={`font-medium ${lowStockCount > 0 ? 'text-destructive' : 'text-primary'}`}>
                  {lowStockCount}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Available Menu Items</span>
                <span className="font-medium">{availableItems}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Menu Items</span>
                <span className="font-medium">{menuItems.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
