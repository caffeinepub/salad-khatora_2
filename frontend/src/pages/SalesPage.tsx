import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useMenuItems, useCreateSaleOrder, useSaleOrders, useApplyDiscountCode, useCalculateTax } from '../hooks/useQueries';
import type { MenuItem, SaleOrder, DiscountApplicationResult } from '../backend';
import {
  ShoppingCart, Plus, Minus, Receipt, ChevronDown, ChevronUp, Loader2, CheckCircle2, ClipboardList, Tag, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface OrderLine {
  menuItem: MenuItem;
  quantity: number;
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
}

function formatDate(ts: bigint) {
  const ms = Number(ts) / 1_000_000;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(ms));
}

// ─── New Order Section ────────────────────────────────────────────────────────

function NewOrderSection() {
  const { data: menuItems, isLoading: menuLoading } = useMenuItems();
  const createSaleOrder = useCreateSaleOrder();
  const applyDiscountMutation = useApplyDiscountCode();

  const [orderLines, setOrderLines] = useState<Map<string, OrderLine>>(new Map());
  const [note, setNote] = useState('');
  const [success, setSuccess] = useState(false);

  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountApplicationResult | null>(null);
  const [promoError, setPromoError] = useState('');

  const availableItems = (menuItems ?? []).filter((item) => item.isAvailable);

  const getQty = (id: bigint) => orderLines.get(id.toString())?.quantity ?? 0;

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
    // Clear applied discount when order changes
    setAppliedDiscount(null);
    setPromoError('');
  };

  const lines = Array.from(orderLines.values());
  const subtotal = lines.reduce((sum, l) => sum + l.menuItem.sellingPrice * l.quantity, 0);
  const discountAmount = appliedDiscount?.discountAmount ?? 0;
  const postDiscountSubtotal = Math.max(0, subtotal - discountAmount);
  const hasItems = lines.length > 0;

  // Calculate tax on post-discount subtotal
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
      await createSaleOrder.mutateAsync({
        items: lines.map((l) => [l.menuItem.id, BigInt(l.quantity)]),
        note,
        discountCodeId: appliedDiscount ? appliedDiscount.discountCode.id : undefined,
      });
      setOrderLines(new Map());
      setNote('');
      setAppliedDiscount(null);
      setPromoCode('');
      setPromoError('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
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
  const { data: orders, isLoading } = useSaleOrders(0, 50);
  const [expandedId, setExpandedId] = useState<bigint | null>(null);

  const sorted = [...(orders ?? [])].sort((a, b) => Number(b.createdAt - a.createdAt));

  return (
    <Card className="border-border shadow-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-heading font-semibold">Sales History</CardTitle>
              <CardDescription className="text-xs">All past orders</CardDescription>
            </div>
          </div>
          {!isLoading && sorted.length > 0 && (
            <Badge variant="secondary" className="text-xs">{sorted.length} order{sorted.length !== 1 ? 's' : ''}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <ClipboardList className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="font-medium text-foreground text-sm">No orders yet</p>
            <p className="text-muted-foreground text-xs mt-1">Place your first order above.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order ID</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date & Time</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Items</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((order) => {
                    const isExpanded = expandedId === order.id;
                    return (
                      <>
                        <tr
                          key={order.id.toString()}
                          className="border-b border-border/50 hover:bg-accent/30 transition-colors cursor-pointer"
                          onClick={() => setExpandedId(isExpanded ? null : order.id)}
                        >
                          <td className="py-3 px-3 font-mono text-xs text-muted-foreground">#{order.id.toString()}</td>
                          <td className="py-3 px-3 text-foreground">{formatDate(order.createdAt)}</td>
                          <td className="py-3 px-3 text-muted-foreground">
                            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                          </td>
                          <td className="py-3 px-3 text-right font-semibold text-primary">{formatCurrency(order.totalAmount)}</td>
                          <td className="py-3 px-3 text-muted-foreground">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${order.id}-detail`} className="bg-secondary/30">
                            <td colSpan={5} className="px-3 py-3">
                              <OrderDetail order={order} />
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {sorted.map((order) => {
                const isExpanded = expandedId === order.id;
                return (
                  <div key={order.id.toString()} className="border border-border rounded-xl overflow-hidden">
                    <button
                      className="w-full flex items-center justify-between p-4 hover:bg-accent/30 transition-colors text-left"
                      onClick={() => setExpandedId(isExpanded ? null : order.id)}
                    >
                      <div>
                        <p className="font-mono text-xs text-muted-foreground">Order #{order.id.toString()}</p>
                        <p className="text-sm font-medium text-foreground mt-0.5">{formatDate(order.createdAt)}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary">{formatCurrency(order.totalAmount)}</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="border-t border-border p-4 bg-secondary/20">
                        <OrderDetail order={order} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Order Detail ─────────────────────────────────────────────────────────────

function OrderDetail({ order }: { order: SaleOrder }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Line Items</p>
      {order.items.map(([menuItemId, name, quantity, unitPrice]) => (
        <div key={menuItemId.toString()} className="flex items-center justify-between text-sm">
          <span className="text-foreground">{name} × {quantity.toString()}</span>
          <span className="text-muted-foreground">{formatCurrency(unitPrice)} ea · {formatCurrency(unitPrice * Number(quantity))}</span>
        </div>
      ))}

      <Separator className="my-1" />

      {/* Subtotal */}
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <span className="text-foreground">{formatCurrency(order.subtotal)}</span>
      </div>

      {/* Discount */}
      {order.discountAmount > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-primary flex items-center gap-1">
            <Tag className="w-3 h-3" /> Discount
          </span>
          <span className="text-primary font-medium">-{formatCurrency(order.discountAmount)}</span>
        </div>
      )}

      {/* Tax Breakdown */}
      {order.taxBreakdown && order.taxBreakdown.length > 0 && (
        <>
          {order.taxBreakdown.map((tax, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{tax.name} ({tax.rate}%)</span>
              <span className="text-foreground">{formatCurrency(tax.amount)}</span>
            </div>
          ))}
        </>
      )}

      <Separator className="my-1" />

      {/* Grand Total */}
      <div className="flex justify-between font-bold text-sm">
        <span>Grand Total</span>
        <span className="text-primary">{formatCurrency(order.totalAmount)}</span>
      </div>

      {order.note && (
        <div className="mt-2 pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground">Note: {order.note}</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SalesPage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();

  useEffect(() => {
    if (!identity) navigate({ to: '/login' });
  }, [identity, navigate]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Billing & Sales</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Create new orders and view sales history
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NewOrderSection />
        <SalesHistorySection />
      </div>
    </div>
  );
}
