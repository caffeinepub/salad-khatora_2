import React, { useState } from 'react';
import { useIngredients, useSalesStats, useGetCallerUserProfile, useSaveCallerUserProfile, UserProfile } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import ProfileSetupModal from '../components/ProfileSetupModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, ShoppingCart, DollarSign, AlertTriangle, RefreshCw, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const { data: ingredients = [], isLoading: ingredientsLoading } = useIngredients();
  const { data: salesStats, isLoading: salesLoading } = useSalesStats();
  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched: profileFetched,
  } = useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();

  const [refreshKey, setRefreshKey] = useState(0);

  const totalIngredients = ingredients.length;
  const totalInventoryValue = ingredients.reduce((sum, i) => sum + i.quantity * i.costPrice, 0);
  const lowStockCount = ingredients.filter(i => i.quantity <= i.lowStockThreshold).length;

  const showProfileSetup = isAuthenticated && !profileLoading && profileFetched && userProfile === null;

  const handleSaveProfile = async (profile: UserProfile) => {
    await saveProfile.mutateAsync(profile);
  };

  const stats = [
    {
      title: 'Total Ingredients',
      value: ingredientsLoading ? '...' : totalIngredients.toString(),
      icon: Package,
      description: 'Items in inventory',
      color: 'text-blue-600',
    },
    {
      title: 'Inventory Value',
      value: ingredientsLoading ? '...' : `$${totalInventoryValue.toFixed(2)}`,
      icon: DollarSign,
      description: 'Total stock value',
      color: 'text-green-600',
    },
    {
      title: 'Low Stock Items',
      value: ingredientsLoading ? '...' : lowStockCount.toString(),
      icon: AlertTriangle,
      description: 'Need restocking',
      color: lowStockCount > 0 ? 'text-orange-600' : 'text-green-600',
    },
    {
      title: 'Total Revenue',
      value: salesLoading ? '...' : `$${(salesStats?.totalRevenue ?? 0).toFixed(2)}`,
      icon: TrendingUp,
      description: 'All-time sales',
      color: 'text-purple-600',
    },
    {
      title: 'Total Orders',
      value: salesLoading ? '...' : (salesStats?.totalOrders ?? 0).toString(),
      icon: ShoppingCart,
      description: 'Orders processed',
      color: 'text-indigo-600',
    },
  ];

  return (
    <div className="space-y-6">
      {showProfileSetup && (
        <ProfileSetupModal
          onSave={handleSaveProfile}
          isSaving={saveProfile.isPending}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          {userProfile && (
            <p className="text-muted-foreground">Welcome back, {userProfile.name}!</p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setRefreshKey(k => k + 1)}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.map(stat => (
          <Card key={stat.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ingredientsLoading || salesLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-bold">{stat.value}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {lowStockCount > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="flex items-center gap-3 pt-4">
            <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0" />
            <p className="text-sm text-orange-800 dark:text-orange-200">
              <strong>{lowStockCount} ingredient{lowStockCount !== 1 ? 's are' : ' is'} running low.</strong>{' '}
              Consider restocking soon to avoid disruptions.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
