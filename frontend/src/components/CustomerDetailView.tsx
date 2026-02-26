import React, { useState } from 'react';
import {
  useCustomer,
  useSubscriptions,
  useCustomerOrderHistory,
  useLoyaltyBalance,
  useLoyaltyTransactions,
  useRedeemLoyaltyPoints,
  SubscriptionStatus,
  type SaleOrder,
  type LoyaltyTransaction,
} from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Calendar,
  Package,
  Star,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  Loader2,
  Gift,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface CustomerDetailViewProps {
  customerId: number;
  onBack: () => void;
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
}

function formatDate(ts: number) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(ts));
}

function OrderRow({ order }: { order: SaleOrder }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-4 hover:bg-accent/30 transition-colors text-left"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground">#{order.id}</div>
          <div className="text-xs text-muted-foreground hidden sm:block">{formatDate(order.createdAt)}</div>
          <div className="text-xs text-muted-foreground truncate">
            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-sm font-semibold text-primary">{formatCurrency(order.totalAmount)}</span>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border bg-secondary/20 p-4 space-y-3">
          <p className="text-xs text-muted-foreground sm:hidden">{formatDate(order.createdAt)}</p>

          {/* Items */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Items</p>
            {order.items.map(([itemId, name, qty, price]) => (
              <div key={itemId} className="flex justify-between text-sm">
                <span className="text-foreground">{name} × {qty}</span>
                <span className="text-muted-foreground">{formatCurrency(price * qty)}</span>
              </div>
            ))}
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-primary">Discount</span>
                <span className="text-primary">-{formatCurrency(order.discountAmount)}</span>
              </div>
            )}
            {order.taxBreakdown && order.taxBreakdown.length > 0 && order.taxBreakdown.map((tax, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{tax.name} ({tax.rate}%)</span>
                <span>{formatCurrency(tax.amount)}</span>
              </div>
            ))}
            {order.taxTotal > 0 && order.taxBreakdown?.length === 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(order.taxTotal)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-sm font-bold">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>

          {order.note && (
            <p className="text-xs text-muted-foreground italic">Note: {order.note}</p>
          )}
        </div>
      )}
    </div>
  );
}

function LoyaltyTransactionRow({ txn }: { txn: LoyaltyTransaction }) {
  const isEarned = txn.points > 0;
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <div>
        <p className="text-sm font-medium text-foreground">{txn.reason}</p>
        <p className="text-xs text-muted-foreground">{formatDate(txn.createdAt)}</p>
      </div>
      <span className={`text-sm font-bold ${isEarned ? 'text-green-600' : 'text-destructive'}`}>
        {isEarned ? '+' : ''}{txn.points} pts
      </span>
    </div>
  );
}

export default function CustomerDetailView({ customerId, onBack }: CustomerDetailViewProps) {
  const { data: customer, isLoading: customerLoading } = useCustomer(customerId);
  const { data: subscriptions = [], isLoading: subsLoading } = useSubscriptions(customerId);
  const { data: orderHistory = [], isLoading: ordersLoading } = useCustomerOrderHistory(customerId);
  const { data: loyaltyBalance = 0, isLoading: balanceLoading } = useLoyaltyBalance(customerId);
  const { data: loyaltyTxns = [], isLoading: txnsLoading } = useLoyaltyTransactions(customerId);
  const redeemMutation = useRedeemLoyaltyPoints();

  const [redeemOpen, setRedeemOpen] = useState(false);
  const [redeemPoints, setRedeemPoints] = useState('');
  const [redeemDiscount, setRedeemDiscount] = useState('');
  const [redeemError, setRedeemError] = useState('');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case SubscriptionStatus.active:
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
      case SubscriptionStatus.paused:
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Paused</Badge>;
      case SubscriptionStatus.cancelled:
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleRedeem = async () => {
    setRedeemError('');
    const pts = parseInt(redeemPoints, 10);
    const disc = parseFloat(redeemDiscount);
    if (!pts || pts <= 0) { setRedeemError('Enter a valid points amount.'); return; }
    if (!disc || disc <= 0) { setRedeemError('Enter a valid discount amount.'); return; }
    if (pts > loyaltyBalance) { setRedeemError('Insufficient loyalty points.'); return; }
    try {
      await redeemMutation.mutateAsync({ customerId, points: pts, discountAmount: disc });
      setRedeemOpen(false);
      setRedeemPoints('');
      setRedeemDiscount('');
    } catch (err) {
      setRedeemError(err instanceof Error ? err.message : 'Redemption failed.');
    }
  };

  if (customerLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Customer not found.</p>
        <Button variant="outline" onClick={onBack} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={onBack} size="sm">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Customers
      </Button>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {customer.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{customer.email || '—'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{customer.phone || '—'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{customer.address || '—'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Joined {new Date(customer.createdAt).toLocaleDateString()}</span>
          </div>
          {customer.notes && (
            <div className="flex items-start gap-2 text-sm col-span-2">
              <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
              <span>{customer.notes}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loyalty Points Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Loyalty Points
          </h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setRedeemOpen(true)}
            disabled={loyaltyBalance === 0}
          >
            <Gift className="h-4 w-4 mr-1.5" />
            Redeem Points
          </Button>
        </div>

        <Card>
          <CardContent className="pt-4">
            {balanceLoading ? (
              <Skeleton className="h-12 w-32" />
            ) : (
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-yellow-50 border border-yellow-200 flex items-center justify-center">
                  <Star className="h-7 w-7 text-yellow-500 fill-yellow-400" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{loyaltyBalance.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">points available</p>
                </div>
              </div>
            )}

            <Separator className="mb-3" />

            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Transaction History</p>
            {txnsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : loyaltyTxns.length === 0 ? (
              <p className="text-sm text-muted-foreground">No transactions yet.</p>
            ) : (
              <div className="max-h-48 overflow-y-auto">
                {loyaltyTxns.map(txn => (
                  <LoyaltyTransactionRow key={txn.id} txn={txn} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order History Section */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" />
          Order History ({orderHistory.length})
        </h3>
        {ordersLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : orderHistory.length === 0 ? (
          <p className="text-muted-foreground text-sm">No orders found for this customer.</p>
        ) : (
          <div className="space-y-2">
            {orderHistory.map(order => (
              <OrderRow key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>

      {/* Subscriptions Section */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Package className="h-5 w-5" />
          Subscriptions ({subscriptions.length})
        </h3>
        {subsLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : subscriptions.length === 0 ? (
          <p className="text-muted-foreground text-sm">No subscriptions found.</p>
        ) : (
          <div className="space-y-3">
            {subscriptions.map(sub => (
              <Card key={sub.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{sub.planName}</p>
                      <p className="text-sm text-muted-foreground">
                        Every {sub.frequencyDays} day{sub.frequencyDays !== 1 ? 's' : ''}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Next renewal: {new Date(sub.nextRenewalDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(sub.status)}
                      <p className="text-sm font-medium mt-1">{formatCurrency(sub.totalPrice)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Redeem Points Dialog */}
      <Dialog open={redeemOpen} onOpenChange={setRedeemOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redeem Loyalty Points</DialogTitle>
            <DialogDescription>
              {customer.name} has <strong>{loyaltyBalance.toLocaleString()} points</strong> available.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="redeem-points">Points to Redeem</Label>
              <Input
                id="redeem-points"
                type="number"
                min={1}
                max={loyaltyBalance}
                placeholder="e.g. 100"
                value={redeemPoints}
                onChange={e => setRedeemPoints(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="redeem-discount">Discount Amount ($)</Label>
              <Input
                id="redeem-discount"
                type="number"
                min={0.01}
                step={0.01}
                placeholder="e.g. 5.00"
                value={redeemDiscount}
                onChange={e => setRedeemDiscount(e.target.value)}
              />
            </div>
            {redeemError && (
              <p className="text-sm text-destructive">{redeemError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRedeemOpen(false)}>Cancel</Button>
            <Button onClick={handleRedeem} disabled={redeemMutation.isPending}>
              {redeemMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Gift className="h-4 w-4 mr-2" />}
              Redeem
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
