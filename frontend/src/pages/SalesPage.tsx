import React, { useState } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, Tag, ChevronDown, ChevronUp, Loader2, Receipt, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  useMenuItems,
  useCreateSaleOrder,
  useSaleOrders,
  useApplyDiscountCode,
  useCustomers,
  useLoyaltyBalance,
  useTaxConfigs,
} from '../hooks/useQueries';
import type { MenuItem, DiscountApplicationResult } from '../hooks/useQueries';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatDate(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleString();
}

interface OrderLine {
  menuItem: MenuItem;
  quantity: number;
}

interface LoyaltyBalanceDisplayProps {
  customerId: bigint;
}

function LoyaltyBalanceDisplay({ customerId }: LoyaltyBalanceDisplayProps) {
  const { data: balance } = useLoyaltyBalance(customerId);
  return (
    <span className="text-xs text-muted-foreground ml-2">
      ({balance != null ? Number(balance).toLocaleString() : 0} pts)
    </span>
  );
}

export default function SalesPage() {
  const { data: menuItems = [] } = useMenuItems();
  const { data: saleOrders = [] } = useSaleOrders();
  const { data: customers = [] } = useCustomers();
  const { data: taxConfigs = [] } = useTaxConfigs();
  const createOrder = useCreateSaleOrder();
  const applyDiscount = useApplyDiscountCode();

  const [lines, setLines] = useState<OrderLine[]>([]);
  const [note, setNote] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountApplicationResult | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<bigint | null>(null);
  const [expandedId, setExpandedId] = useState<bigint | null>(null);
  const [promoError, setPromoError] = useState('');

  // Use sellingPrice (the correct field name from MenuItem type)
  const subtotal = lines.reduce((sum, l) => sum + l.menuItem.sellingPrice * l.quantity, 0);
  const discountAmount = appliedDiscount?.discountAmount ?? 0;
  const postDiscountSubtotal = Math.max(0, subtotal - discountAmount);

  const taxBreakdown = (taxConfigs as any[])
    .filter((tc: any) => tc.isActive)
    .map((tc: any) => ({
      name: tc.name,
      rate: Number(tc.rate),
      amount: postDiscountSubtotal * Number(tc.rate) / 100,
    }));
  const taxTotal = taxBreakdown.reduce((sum: number, t: any) => sum + t.amount, 0);
  const totalAmount = postDiscountSubtotal + taxTotal;

  const addItem = (item: MenuItem) => {
    setLines(prev => {
      const existing = prev.find(l => l.menuItem.id === item.id);
      if (existing) {
        return prev.map(l => l.menuItem.id === item.id ? { ...l, quantity: l.quantity + 1 } : l);
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  };

  const updateQty = (itemId: number, delta: number) => {
    setLines(prev =>
      prev
        .map(l => l.menuItem.id === itemId ? { ...l, quantity: l.quantity + delta } : l)
        .filter(l => l.quantity > 0)
    );
  };

  const removeItem = (itemId: number) => {
    setLines(prev => prev.filter(l => l.menuItem.id !== itemId));
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoError('');
    try {
      const result = await applyDiscount.mutateAsync({ code: promoCode.trim(), orderTotal: subtotal });
      setAppliedDiscount(result);
    } catch (e: any) {
      setPromoError(e?.message ?? 'Invalid promo code');
      setAppliedDiscount(null);
    }
  };

  const handleSubmitOrder = async () => {
    if (lines.length === 0) return;
    try {
      await createOrder.mutateAsync({
        items: lines.map(l => ({
          itemId: l.menuItem.id,
          quantity: l.quantity,
          price: l.menuItem.sellingPrice,
        })),
        subtotal,
        totalAmount,
        discountAmount,
        taxBreakdown,
        taxTotal,
        note,
        discountCodeId: appliedDiscount ? appliedDiscount.discountCode.id : undefined,
        customerId: selectedCustomerId ?? undefined,
      });
      setLines([]);
      setNote('');
      setPromoCode('');
      setAppliedDiscount(null);
      setSelectedCustomerId(null);
    } catch {
      // handled by mutation
    }
  };

  const toggleExpand = (id: bigint) => {
    setExpandedId(prev => (prev != null && prev === id ? null : id));
  };

  const availableItems = menuItems.filter(m => m.isAvailable);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Billing & Sales</h1>
        <p className="text-muted-foreground text-sm mt-1">Create orders and view sales history</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* New Order */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">New Order</h2>

          {/* Menu Items */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Menu Items</Label>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
              {availableItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => addItem(item)}
                  className="text-left p-3 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
                >
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-primary font-semibold">{formatCurrency(item.sellingPrice)}</p>
                </button>
              ))}
              {availableItems.length === 0 && (
                <p className="col-span-2 text-muted-foreground text-sm text-center py-4">No available menu items.</p>
              )}
            </div>
          </div>

          {/* Order Lines */}
          {lines.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Order Items</Label>
              {lines.map(line => (
                <div key={line.menuItem.id} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/30">
                  <span className="flex-1 text-sm truncate">{line.menuItem.name}</span>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQty(line.menuItem.id, -1)}>
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="text-sm w-6 text-center">{line.quantity}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQty(line.menuItem.id, 1)}>
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <span className="text-sm font-medium w-16 text-right">{formatCurrency(line.menuItem.sellingPrice * line.quantity)}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeItem(line.menuItem.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Customer */}
          <div className="space-y-1">
            <Label className="text-sm font-medium flex items-center gap-1">
              <Users className="w-3 h-3" /> Customer (optional)
            </Label>
            <Select
              value={selectedCustomerId != null ? selectedCustomerId.toString() : 'none'}
              onValueChange={v => setSelectedCustomerId(v === 'none' ? null : BigInt(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select customer..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No customer</SelectItem>
                {customers.map(c => (
                  <SelectItem key={c.id.toString()} value={c.id.toString()}>
                    {c.name}
                    {selectedCustomerId === c.id && <LoyaltyBalanceDisplay customerId={c.id} />}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Promo Code */}
          <div className="space-y-1">
            <Label className="text-sm font-medium flex items-center gap-1">
              <Tag className="w-3 h-3" /> Promo Code
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter code..."
                value={promoCode}
                onChange={e => { setPromoCode(e.target.value); setPromoError(''); }}
                className="flex-1"
              />
              <Button variant="outline" size="sm" onClick={handleApplyPromo} disabled={applyDiscount.isPending || !promoCode.trim()}>
                {applyDiscount.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Apply'}
              </Button>
            </div>
            {promoError && <p className="text-xs text-destructive">{promoError}</p>}
            {appliedDiscount && (
              <p className="text-xs text-green-600">
                ✓ {appliedDiscount.discountCode.code} — {formatCurrency(appliedDiscount.discountAmount)} off
              </p>
            )}
          </div>

          {/* Note */}
          <div className="space-y-1">
            <Label htmlFor="order-note" className="text-sm font-medium">Note</Label>
            <Input id="order-note" placeholder="Special instructions..." value={note} onChange={e => setNote(e.target.value)} />
          </div>

          {/* Totals */}
          {lines.length > 0 && (
            <Card>
              <CardContent className="pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                {taxBreakdown.map((t: any) => (
                  <div key={t.name} className="flex justify-between text-sm text-muted-foreground">
                    <span>{t.name} ({t.rate}%)</span>
                    <span>{formatCurrency(t.amount)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
                <Button
                  className="w-full mt-2"
                  onClick={handleSubmitOrder}
                  disabled={createOrder.isPending || lines.length === 0}
                >
                  {createOrder.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Receipt className="w-4 h-4 mr-2" />
                  Place Order
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sales History */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Sales History</h2>
          {(saleOrders as any[]).length === 0 ? (
            <div className="text-center text-muted-foreground py-10 border border-dashed border-border rounded-lg">
              <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No orders yet.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {[...(saleOrders as any[])].reverse().map((order: any) => (
                <div key={order.id.toString()} className="border border-border rounded-lg bg-card overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
                    onClick={() => toggleExpand(order.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Receipt className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="text-left">
                        <p className="text-sm font-medium">Order #{order.id.toString()}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">{formatCurrency(order.totalAmount)}</span>
                      {expandedId != null && expandedId === order.id
                        ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      }
                    </div>
                  </button>

                  {expandedId != null && expandedId === order.id && (
                    <div className="px-3 pb-3 space-y-2 border-t border-border">
                      <p className="text-xs text-muted-foreground pt-2">{formatDate(order.createdAt)}</p>
                      <div className="space-y-1">
                        {order.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Item #{item.itemId?.toString() ?? idx} × {item.quantity?.toString() ?? 1}</span>
                            <span>{formatCurrency(item.price ?? 0)}</span>
                          </div>
                        ))}
                      </div>
                      <Separator />
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>{formatCurrency(order.subtotal)}</span>
                        </div>
                        {order.discountAmount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Discount</span>
                            <span>-{formatCurrency(order.discountAmount)}</span>
                          </div>
                        )}
                        {(order.taxBreakdown ?? []).map((t: any, i: number) => (
                          <div key={i} className="flex justify-between text-muted-foreground">
                            <span>{t.name} ({t.rate}%)</span>
                            <span>{formatCurrency(t.amount)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between font-semibold text-sm pt-1">
                          <span>Total</span>
                          <span>{formatCurrency(order.totalAmount)}</span>
                        </div>
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
        </div>
      </div>
    </div>
  );
}
