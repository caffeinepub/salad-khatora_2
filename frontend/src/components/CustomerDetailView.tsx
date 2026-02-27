import React, { useState } from 'react';
import {
  useCustomers,
  useCustomerOrderHistory,
  useLoyaltyTransactions,
  useLoyaltyBalance,
  useRedeemLoyaltyPoints,
} from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { User, Phone, Mail, MapPin, Star, ShoppingBag, Gift, Loader2 } from 'lucide-react';

interface CustomerDetailViewProps {
  customerId: bigint;
  /** Called when the user wants to go back / close the detail view */
  onBack?: () => void;
  /** Alias for onBack */
  onClose?: () => void;
}

export default function CustomerDetailView({ customerId, onBack, onClose }: CustomerDetailViewProps) {
  const { data: customers = [], isLoading: customerLoading } = useCustomers();
  const customer = customers.find((c) => c.id === customerId) ?? null;

  const { data: orders = [], isLoading: ordersLoading } = useCustomerOrderHistory(customerId);
  const { data: loyaltyBalance } = useLoyaltyBalance(customerId);
  const { data: loyaltyTxns = [], isLoading: txnsLoading } = useLoyaltyTransactions(customerId);
  const redeemPoints = useRedeemLoyaltyPoints();

  const [showRedeem, setShowRedeem] = useState(false);
  const [redeemPts, setRedeemPts] = useState('');
  const [redeemDiscount, setRedeemDiscount] = useState('');

  // Support both onBack and onClose as the dismiss callback
  const handleDismiss = onBack ?? onClose;

  const handleRedeem = async () => {
    const pts = parseInt(redeemPts, 10);
    const discount = parseFloat(redeemDiscount);
    if (isNaN(pts) || pts <= 0 || isNaN(discount) || discount <= 0) return;
    try {
      await redeemPoints.mutateAsync({
        customerId,
        points: BigInt(pts),
        discountAmount: discount,
      });
      setShowRedeem(false);
      setRedeemPts('');
      setRedeemDiscount('');
    } catch {
      // error handled by mutation state
    }
  };

  if (customerLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Customer not found.
      </div>
    );
  }

  const balance = loyaltyBalance !== undefined ? Number(loyaltyBalance) : Number(customer.loyaltyPoints);

  return (
    <div className="space-y-6 p-6">
      {/* Back button */}
      {handleDismiss && (
        <Button variant="ghost" size="sm" onClick={handleDismiss} className="gap-2 -ml-2">
          ← Back to Customers
        </Button>
      )}

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            {customer.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <span>{customer.mobileNo}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span>{customer.email ?? 'Not provided'}</span>
          </div>
          {customer.address && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span>{customer.address}</span>
            </div>
          )}
          {customer.preference && (
            <div className="flex items-center gap-2 text-sm">
              <Star className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Preference:</span>
              <span>{customer.preference}</span>
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            Member since {new Date(Number(customer.createdAt) / 1_000_000).toLocaleDateString()}
          </div>
        </CardContent>
      </Card>

      {/* Loyalty Points */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Gift className="w-4 h-4 text-primary" />
            Loyalty Points
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-3xl font-bold text-primary">{balance}</div>
              <div className="text-xs text-muted-foreground">Available points</div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowRedeem(true)}
              disabled={balance === 0}
            >
              Redeem Points
            </Button>
          </div>

          {txnsLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : loyaltyTxns.length > 0 ? (
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Recent Transactions</div>
              {loyaltyTxns.slice(0, 5).map((txn) => (
                <div key={txn.id.toString()} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{txn.reason}</span>
                  <Badge variant={Number(txn.points) >= 0 ? 'default' : 'destructive'}>
                    {Number(txn.points) >= 0 ? '+' : ''}{Number(txn.points)} pts
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No loyalty transactions yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Order History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingBag className="w-4 h-4 text-primary" />
            Order History
            <Badge variant="secondary" className="ml-auto">{orders.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 10).map((order) => (
                <div
                  key={order.id.toString()}
                  className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0 last:pb-0"
                >
                  <div>
                    <div className="font-medium">Order #{order.id.toString()}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(Number(order.createdAt) / 1_000_000).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${order.totalAmount.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">{order.items.length} item(s)</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Redeem Dialog */}
      <Dialog open={showRedeem} onOpenChange={setShowRedeem}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redeem Loyalty Points</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Points to Redeem</Label>
              <Input
                type="number"
                min={1}
                max={balance}
                value={redeemPts}
                onChange={(e) => setRedeemPts(e.target.value)}
                placeholder={`Max: ${balance}`}
              />
            </div>
            <div className="space-y-1">
              <Label>Discount Amount ($)</Label>
              <Input
                type="number"
                min={0.01}
                step="0.01"
                value={redeemDiscount}
                onChange={(e) => setRedeemDiscount(e.target.value)}
                placeholder="e.g. 5.00"
              />
            </div>
            {redeemPoints.isError && (
              <p className="text-sm text-destructive">
                {redeemPoints.error instanceof Error
                  ? redeemPoints.error.message
                  : 'Failed to redeem points'}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRedeem(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRedeem}
              disabled={redeemPoints.isPending || !redeemPts || !redeemDiscount}
            >
              {redeemPoints.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Redeem
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
