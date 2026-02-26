import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useMenuItems,
  useCreateSaleOrder,
  useSaleOrders,
  useApplyDiscountCode,
  useCalculateTax,
  useCustomers,
  useLoyaltyBalance,
  type DiscountApplicationResult,
} from '../hooks/useQueries';
import type { MenuItem, SaleOrder } from '../hooks/useQueries';
import {
  ShoppingCart, Plus, Minus, Receipt, ChevronDown, ChevronUp, Loader2, CheckCircle2,
  ClipboardList, Tag, X, Users, Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface OrderLine {
  menuItem: MenuItem;
  quantity: number;
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

// ─── Customer Loyalty Badge ───────────────────────────────────────────────────

function CustomerLoyaltyBadge({ customerId }: { customerId: number }) {
  const { data: balance, isLoading } = useLoyaltyBalance(customerId);

  if (isLoading) return <Skeleton className="h-6 w-24" />;

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs font-medium">
      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-500" />
      {(balance ?? 0).toLocaleString()} pts
    </div>
  );
}

// ─── New Order Section ────────────────────────────────────────────────────────

function NewOrderSection() {
  const { data: menuItems, isLoading: menuLoading } = useMenuItems();
  const { data: customers = [] } = useCustomers();
  const createSaleOrder = useCreateSaleOrder();
  const applyDiscountMutation = useApplyDiscountCode();

  const [orderLines, setOrderLines] = useState<Map<string, OrderLine>>(new Map());
  const [note, setNote] = useState('');
  const [success, setSuccess] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | undefined>(undefined);

  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountApplicationResult | null>(null);
  const [promoError, setPromoError] = useState('');

  const availableItems = (menuItems ?? []).filter((item) => item.isAvailable);

  const getQty = (id: number) => orderLines.get(id.toString())?.quantity ?? 0;

  const setQty = (item: MenuItem, qty: number) => {
    setOrderLines((prev) => {
      const next = new Map(prev);
      if (qty <= 0) {
        next.delete(item.id.toString());
      } else {
        next.set(item.id.toString(), { menuItem: item, quantity: qty });
      }
      return next;
    });
    setAppliedDiscount(null);
    setPromoError('');
  };

  const lines = Array.from(orderLines.values());
  const subtotal = lines.reduce((sum, l) => sum + l.menuItem.sellingPrice * l.quantity, 0);
  const discountAmount = appliedDiscount?.discountAmount ?? 0;
  const postDiscountSubtotal = Math.max(0, subtotal - discountAmount);
  const hasItems = lines.length > 0;

  const { data: taxResult } = useCalculateTax(hasItems ? postDiscountSubtotal : 0);
  const taxTotal = taxResult?.totalTaxAmount ?? 0;
  const grandTotal = postDiscountSubtotal + taxTotal;

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoError('');
    try {
      const result = await applyDiscountMutation.mutateAsync({
        code: promoCode.trim().toUpperCase(),
        orderSubtotal: subtotal,
      });
      setAppliedDiscount(result);
    } catch (err) {
      setPromoError(err instanceof Error ? err.message : 'Invalid promo code');
      setAppliedDiscount(null);
    }
  };

  const handleRemovePromo = () => {
    setAppliedDiscount(null);
    setPromoCode('');
    setPromoError('');
  };

  const handleSubmit = async () => {
    if (!hasItems) return;
    try {
      const result = await createSaleOrder.mutateAsync({
        items: lines.map((l) => ({ menuItemId: l.menuItem.id, quantity: l.quantity })),
        note,
        discountCodeId: appliedDiscount ? Number(appliedDiscount.discountCode.id) : undefined,
        customerId: selectedCustomerId,
      });

      setOrderLines(new Map());
      setNote('');
      setAppliedDiscount(null);
      setPromoCode('');
      setPromoError('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

      // Show loyalty points toast if customer was selected
      if (selectedCustomerId !== undefined && result.pointsAwarded > 0) {
        const customer = customers.find(c => c.id === selectedCustomerId);
        toast.success(
          `Order placed! ${customer?.name ?? 'Customer'} earned ${result.pointsAwarded} loyalty point${result.pointsAwarded !== 1 ? 's' : ''}.`,
          { duration: 4000 }
        );
      }
    } catch {
      // error handled below
    }
  };

  return (
    <Card className="border-border shadow-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
            <ShoppingCart className="w-4 h-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base font-heading font-semibold">New Order</CardTitle>
            <CardDescription className="text-xs">Select items and quantities</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Success banner */}
        {success && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-medium animate-fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            Order placed successfully!
          </div>
        )}

        {/* Error banner */}
        {createSaleOrder.isError && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {createSaleOrder.error instanceof Error
              ? createSaleOrder.error.message
              : 'Failed to place order. Please try again.'}
          </div>
        )}

        {/* Customer Selector */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Users className="w-3 h-3" /> Customer (optional)
          </Label>
          <div className="flex items-center gap-2">
            <Select
              value={selectedCustomerId !== undefined ? String(selectedCustomerId) : 'none'}
              onValueChange={val => setSelectedCustomerId(val === 'none' ? undefined : Number(val))}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="No customer selected" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No customer</SelectItem>
                {customers.map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCustomerId !== undefined && (
              <CustomerLoyaltyBadge customerId={selectedCustomerId} />
            )}
          </div>
          {selectedCustomerId !== undefined && (
            <p className="text-xs text-muted-foreground">
              Customer will earn <strong>{Math.floor(grandTotal)}</strong> loyalty point{Math.floor(grandTotal) !== 1 ? 's' : ''} for this order.
            </p>
          )}
        </div>

        {/* Menu items grid */}
        {menuLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : availableItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <ShoppingCart className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="font-medium text-foreground text-sm">No available menu items</p>
            <p className="text-muted-foreground text-xs mt-1">Add and enable menu items first.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availableItems.map((item) => {
              const qty = getQty(item.id);
              const selected = qty > 0;
              return (
                <div
                  key={item.id.toString()}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-xl border transition-all',
                    selected
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card hover:bg-accent/50'
                  )}
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="font-medium text-sm text-foreground truncate">{item.name}</p>
                    <p className="text-xs text-primary font-semibold">{formatCurrency(item.sellingPrice)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => setQty(item, qty - 1)}
                      disabled={qty === 0}
                      className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className={cn('w-6 text-center text-sm font-semibold', selected ? 'text-primary' : 'text-muted-foreground')}>
                      {qty}
                    </span>
                    <button
                      onClick={() => setQty(item, qty + 1)}
                      className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Promo Code */}
        {hasItems && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Tag className="w-3 h-3" /> Promo Code
            </Label>
            {appliedDiscount ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/20">
                <div>
                  <p className="text-sm font-semibold text-primary">{appliedDiscount.discountCode.code} applied!</p>
                  <p className="text-xs text-muted-foreground">
                    Discount: -{formatCurrency(appliedDiscount.discountAmount)}
                  </p>
                </div>
                <button onClick={handleRemovePromo} className="p-1 rounded-lg hover:bg-primary/20 transition-colors">
                  <X className="w-4 h-4 text-primary" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleApplyPromo()}
                  className="font-mono uppercase"
                />
                <Button
                  variant="outline"
                  onClick={handleApplyPromo}
                  disabled={!promoCode.trim() || applyDiscountMutation.isPending}
                  className="shrink-0"
                >
                  {applyDiscountMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                </Button>
              </div>
            )}
            {promoError && (
              <p className="text-xs text-destructive">{promoError}</p>
            )}
          </div>
        )}

        {/* Order summary */}
        {hasItems && (
          <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order Summary</p>
            {lines.map((l) => (
              <div key={l.menuItem.id.toString()} className="flex justify-between text-sm">
                <span className="text-foreground">{l.menuItem.name} × {l.quantity}</span>
                <span className="font-medium text-foreground">{formatCurrency(l.menuItem.sellingPrice * l.quantity)}</span>
              </div>
            ))}
            <Separator className="my-1" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground">{formatCurrency(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-primary">Discount ({appliedDiscount?.discountCode.code})</span>
                <span className="text-primary font-medium">-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            {taxResult && taxResult.breakdown.length > 0 && (
              <>
                {taxResult.breakdown.map((tax, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{tax.name} ({tax.rate}%)</span>
                    <span className="text-foreground">{formatCurrency(tax.amount)}</span>
                  </div>
                ))}
              </>
            )}
            <Separator className="my-1" />
            <div className="flex justify-between font-bold text-base">
              <span className="text-foreground">Grand Total</span>
              <span className="text-primary">{formatCurrency(grandTotal)}</span>
            </div>
            {selectedCustomerId !== undefined && Math.floor(grandTotal) > 0 && (
              <div className="flex items-center gap-1.5 pt-1 text-xs text-yellow-700">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-500" />
                Earns {Math.floor(grandTotal)} loyalty point{Math.floor(grandTotal) !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}

        {/* Note */}
        <div className="space-y-1.5">
          <Label htmlFor="order-note" className="text-xs text-muted-foreground">Note (optional)</Label>
          <Textarea
            id="order-note"
            placeholder="Any special instructions..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
          />
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={!hasItems || createSaleOrder.isPending}
          className="w-full"
        >
          {createSaleOrder.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Placing Order...
            </>
          ) : (
            <>
              <Receipt className="w-4 h-4 mr-2" />
              Place Order {hasItems && `· ${formatCurrency(grandTotal)}`}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Sales History Section ────────────────────────────────────────────────────

function SalesHistorySection() {
  const { data: orders = [], isLoading } = useSaleOrders();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleExpand = (id: number) => setExpandedId(prev => prev === id ? null : id);

  return (
    <Card className="border-border shadow-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
            <ClipboardList className="w-4 h-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base font-heading font-semibold">Sales History</CardTitle>
            <CardDescription className="text-xs">Recent orders</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <ClipboardList className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="font-medium text-foreground text-sm">No orders yet</p>
            <p className="text-muted-foreground text-xs mt-1">Orders will appear here once placed.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {orders.map((order) => (
              <div key={order.id} className="border border-border rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-3 hover:bg-accent/30 transition-colors text-left"
                  onClick={() => toggleExpand(order.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-xs font-mono text-muted-foreground">#{order.id}</span>
                    <span className="text-xs text-muted-foreground hidden sm:block">{formatDate(order.createdAt)}</span>
                    <span className="text-xs text-muted-foreground">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-semibold text-primary">{formatCurrency(order.totalAmount)}</span>
                    {expandedId === order.id
                      ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </button>

                {expandedId === order.id && (
                  <div className="border-t border-border bg-secondary/20 p-3 space-y-2">
                    <p className="text-xs text-muted-foreground sm:hidden">{formatDate(order.createdAt)}</p>
                    {order.items.map(([itemId, name, qty, price]) => (
                      <div key={itemId} className="flex justify-between text-sm">
                        <span className="text-foreground">{name} × {qty}</span>
                        <span className="text-muted-foreground">{formatCurrency(price * qty)}</span>
                      </div>
                    ))}
                    <Separator />
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
                    <Separator />
                    <div className="flex justify-between text-sm font-bold">
                      <span>Total</span>
                      <span className="text-primary">{formatCurrency(order.totalAmount)}</span>
                    </div>
                    {order.note && (
                      <p className="text-xs text-muted-foreground italic">Note: {order.note}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SalesPage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();

  useEffect(() => {
    if (!identity) navigate({ to: '/login' });
  }, [identity, navigate]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Billing & Sales</h1>
        <p className="text-muted-foreground text-sm mt-1">Create orders and view sales history</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NewOrderSection />
        <SalesHistorySection />
      </div>
    </div>
  );
}
