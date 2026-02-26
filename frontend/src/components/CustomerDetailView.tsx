import React, { useState } from 'react';
import { ArrowLeft, Star, Gift, ShoppingBag, Loader2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  useCustomer,
  useCustomerOrderHistory,
  useLoyaltyBalance,
  useLoyaltyTransactions,
  useRedeemLoyaltyPoints,
} from '../hooks/useQueries';
import type { Customer, SaleOrder } from '../backend';

interface CustomerDetailViewProps {
  customerId: bigint;
  onBack: () => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatDate(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleDateString();
}

function formatDateTime(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleString();
}

export default function CustomerDetailView({ customerId, onBack }: CustomerDetailViewProps) {
  const { data: customer, isLoading: customerLoading } = useCustomer(customerId);
  const { data: orders = [], isLoading: ordersLoading } = useCustomerOrderHistory(customerId);
  const { data: loyaltyBalance = BigInt(0), isLoading: balanceLoading } = useLoyaltyBalance(customerId);
  const { data: loyaltyTxns = [], isLoading: txnsLoading } = useLoyaltyTransactions(customerId);
  const redeemMutation = useRedeemLoyaltyPoints();

  const [redeemPoints, setRedeemPoints] = useState('');
  const [redeemDiscount, setRedeemDiscount] = useState('');

  const isLoading = customerLoading || ordersLoading || balanceLoading || txnsLoading;

  const handleRedeem = async () => {
    const pts = parseInt(redeemPoints, 10);
    const disc = parseFloat(redeemDiscount);
    if (isNaN(pts) || pts <= 0 || isNaN(disc) || disc <= 0) return;
    try {
      await redeemMutation.mutateAsync({
        customerId,
        points: BigInt(pts),
        discountAmount: disc,
      });
      setRedeemPoints('');
      setRedeemDiscount('');
    } catch {
      // handled by mutation
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={onBack} className="mb-4 gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <p className="text-muted-foreground">Customer not found.</p>
      </div>
    );
  }

  const balanceNum = Number(loyaltyBalance);
  const totalSpent = (orders as SaleOrder[]).reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{customer.name}</h1>
          <p className="text-muted-foreground text-sm">Customer Profile</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium">{customer.email || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="text-sm font-medium">{customer.phone || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Joined</p>
              <p className="text-sm font-medium">{formatDate(customer.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Spent</p>
              <p className="text-sm font-medium text-primary">{formatCurrency(totalSpent)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Orders</p>
              <p className="text-sm font-medium">{(orders as SaleOrder[]).length}</p>
            </div>
          </CardContent>
        </Card>

        {/* Loyalty Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              Loyalty Points
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-primary">{balanceNum.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Available points</p>
              </div>
              <Gift className="w-10 h-10 text-muted-foreground/30" />
            </div>

            <Progress value={Math.min((balanceNum / 1000) * 100, 100)} className="h-2" />
            <p className="text-xs text-muted-foreground">{Math.max(0, 1000 - balanceNum)} points to next reward tier</p>

            {/* Redeem */}
            <div className="border border-border rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium">Redeem Points</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="redeem-pts" className="text-xs">Points to Redeem</Label>
                  <Input
                    id="redeem-pts"
                    type="number"
                    min={1}
                    max={balanceNum}
                    placeholder="0"
                    value={redeemPoints}
                    onChange={e => setRedeemPoints(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="redeem-disc" className="text-xs">Discount Amount ($)</Label>
                  <Input
                    id="redeem-disc"
                    type="number"
                    min={0.01}
                    step={0.01}
                    placeholder="0.00"
                    value={redeemDiscount}
                    onChange={e => setRedeemDiscount(e.target.value)}
                  />
                </div>
              </div>
              <Button
                size="sm"
                onClick={handleRedeem}
                disabled={redeemMutation.isPending || !redeemPoints || !redeemDiscount}
                className="w-full"
              >
                {redeemMutation.isPending && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
                Redeem
              </Button>
            </div>

            {/* Transaction History */}
            {loyaltyTxns.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Recent Transactions</p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {loyaltyTxns.slice(0, 10).map(txn => (
                    <div key={txn.id.toString()} className="flex items-center justify-between text-xs py-1 border-b border-border last:border-0">
                      <span className="text-muted-foreground">{txn.reason}</span>
                      <span className={Number(txn.points) >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                        {Number(txn.points) >= 0 ? '+' : ''}{txn.points.toString()} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            Order History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(orders as SaleOrder[]).length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">No orders yet.</p>
          ) : (
            <div className="space-y-2">
              {(orders as SaleOrder[]).map(order => (
                <div key={order.id.toString()} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Order #{order.id.toString()}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(order.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(order.totalAmount)}</p>
                    <p className="text-xs text-muted-foreground">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
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
