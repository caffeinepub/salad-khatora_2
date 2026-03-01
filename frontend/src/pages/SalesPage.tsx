import { useState } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, Tag, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useMenuItems,
  useCreateSaleOrder,
  useCustomers,
} from '../hooks/useQueries';
import type { MenuItem } from '../hooks/useQueries';
import type { DiscountCode, Customer, PaymentMode, SaleOrderItem } from '../backend';
import { toast } from 'sonner';
import { useActor } from '../hooks/useActor';
import CheckoutDialog from '../components/CheckoutDialog';
import BillReceiptView from '../components/BillReceiptView';

interface OrderLine {
  menuItem: MenuItem;
  quantity: number;
}

interface AppliedDiscount {
  discountAmount: number;
  discountCode: DiscountCode;
}

interface CompletedOrder {
  orderId: bigint;
  paymentMode: PaymentMode;
  createdAt: Date;
}

function extractErrorMessage(err: unknown): string {
  if (!err) return 'An unknown error occurred';
  const msg = (err as any)?.message ?? String(err);
  const rejectMatch = msg.match(/Reject message:\s*(.+?)(?:\n|$)/i);
  if (rejectMatch) return rejectMatch[1].trim();
  const canisterMatch = msg.match(/Error from Canister[^:]*:\s*(.+?)(?:\n|$)/i);
  if (canisterMatch) return canisterMatch[1].trim();
  const cleanMsg = msg.replace(/^Call was rejected[\s\S]*?Reject message:\s*/i, '').trim();
  return cleanMsg || 'Failed to place order';
}

function formatCurrency(v: number) { return `₹${v.toFixed(2)}`; }

export default function SalesPage() {
  const { actor, isFetching: actorFetching } = useActor();
  const { data: menuItems = [] } = useMenuItems();
  const { data: customers = [] } = useCustomers();
  const createOrder = useCreateSaleOrder();

  const [lines, setLines] = useState<OrderLine[]>([]);
  const [note, setNote] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<bigint | null>(null);
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<CompletedOrder | null>(null);
  const [billOpen, setBillOpen] = useState(false);

  const subtotal = lines.reduce((sum, l) => sum + (l.menuItem.sellingPrice ?? l.menuItem.price) * l.quantity, 0);
  const discountAmount = appliedDiscount?.discountAmount ?? 0;
  const totalAmount = subtotal - discountAmount;

  const selectedCustomer: Customer | null =
    selectedCustomerId !== null
      ? (customers.find(c => c.id === selectedCustomerId) ?? null)
      : null;

  const addItem = (item: MenuItem) => {
    setLines(prev => {
      const existing = prev.find(l => l.menuItem.id === item.id);
      if (existing) return prev.map(l => l.menuItem.id === item.id ? { ...l, quantity: l.quantity + 1 } : l);
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

  const handleApplyDiscount = async () => {
    if (!discountCode.trim() || !actor) return;
    setApplyingDiscount(true);
    try {
      const result = await actor.applyDiscountCode(discountCode.trim(), subtotal);
      setAppliedDiscount({
        discountAmount: result.discountAmount,
        discountCode: result.discountCode,
      });
      toast.success(`Discount applied: -${formatCurrency(result.discountAmount)}`);
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err));
      setAppliedDiscount(null);
    } finally {
      setApplyingDiscount(false);
    }
  };

  const handleOpenCheckout = () => {
    if (lines.length === 0) {
      toast.error('Add items to the order first');
      return;
    }
    if (!actor) {
      toast.error('System is initializing, please try again.');
      return;
    }
    setCheckoutOpen(true);
  };

  const handleConfirmOrder = async (paymentMode: PaymentMode) => {
    if (!actor) {
      toast.error('System is initializing, please try again.');
      return;
    }

    // Build SaleOrderItem[] with bigint itemId and bigint quantity
    const backendItems: SaleOrderItem[] = lines.map(l => ({
      itemId: BigInt(l.menuItem.id),
      quantity: BigInt(l.quantity),
      price: l.menuItem.sellingPrice ?? l.menuItem.price,
    }));

    // discountCodeId must be bigint | null
    const discountCodeId: bigint | null = appliedDiscount
      ? appliedDiscount.discountCode.id
      : null;

    // customerId must be bigint | null
    const customerId: bigint | null = selectedCustomerId;

    try {
      const orderId = await createOrder.mutateAsync({
        items: backendItems,
        subtotal,
        totalAmount,
        discountAmount,
        taxBreakdown: [],
        taxTotal: 0,
        note,
        discountCodeId,
        customerId,
        paymentType: paymentMode,
      });

      setCheckoutOpen(false);
      setCompletedOrder({
        orderId,
        paymentMode,
        createdAt: new Date(),
      });
      setBillOpen(true);
      toast.success('Order placed successfully!');
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleNewSale = () => {
    setBillOpen(false);
    setCompletedOrder(null);
    setLines([]);
    setNote('');
    setDiscountCode('');
    setAppliedDiscount(null);
    setSelectedCustomerId(null);
    createOrder.reset();
  };

  const isCheckoutDisabled = lines.length === 0 || actorFetching;

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Menu Items */}
      <div className="lg:col-span-2 space-y-4">
        <h1 className="text-2xl font-bold font-heading">Point of Sale</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {menuItems.filter(m => m.isAvailable).map(item => (
            <Card
              key={item.id}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => addItem(item)}
            >
              <CardContent className="p-3">
                <p className="font-medium text-sm truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                <p className="text-xs text-primary font-semibold mt-1">
                  {formatCurrency(item.sellingPrice ?? item.price)}
                </p>
              </CardContent>
            </Card>
          ))}
          {menuItems.filter(m => m.isAvailable).length === 0 && (
            <p className="col-span-3 text-center text-muted-foreground py-8 text-sm">
              No available menu items. Add items in the Menu page.
            </p>
          )}
        </div>
      </div>

      {/* Order Summary */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Current Order
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lines.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No items added yet</p>
            ) : (
              <div className="space-y-2">
                {lines.map(line => (
                  <div key={line.menuItem.id} className="flex items-center gap-2">
                    <span className="text-sm flex-1 truncate">{line.menuItem.name}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQty(line.menuItem.id, -1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-sm w-6 text-center">{line.quantity}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQty(line.menuItem.id, 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                    <span className="text-sm font-medium w-16 text-right">
                      {formatCurrency((line.menuItem.sellingPrice ?? line.menuItem.price) * line.quantity)}
                    </span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeItem(line.menuItem.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
              </div>
              {appliedDiscount && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount ({appliedDiscount.discountCode.code})</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold">
                <span>Total</span><span>{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            {/* Customer */}
            <div>
              <label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                <Users className="h-3 w-3" />Customer (optional)
              </label>
              <Select
                value={selectedCustomerId?.toString() ?? ''}
                onValueChange={val => setSelectedCustomerId(val ? BigInt(val) : null)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(c => (
                    <SelectItem key={Number(c.id)} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Discount Code */}
            <div>
              <label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                <Tag className="h-3 w-3" />Discount Code
              </label>
              <div className="flex gap-2">
                <Input
                  className="h-8 text-sm"
                  placeholder="Enter code"
                  value={discountCode}
                  onChange={e => { setDiscountCode(e.target.value); setAppliedDiscount(null); }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleApplyDiscount}
                  disabled={applyingDiscount || !discountCode.trim()}
                >
                  {applyingDiscount ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Apply'}
                </Button>
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Note</label>
              <Input
                className="h-8 text-sm"
                placeholder="Order note..."
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleOpenCheckout}
              disabled={isCheckoutDisabled}
            >
              {actorFetching
                ? 'Initializing...'
                : `Checkout ${formatCurrency(totalAmount)}`}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Checkout Dialog */}
      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        lines={lines}
        subtotal={subtotal}
        discountAmount={discountAmount}
        taxBreakdown={[]}
        taxTotal={0}
        totalAmount={totalAmount}
        customerName={selectedCustomer?.name}
        discountCode={appliedDiscount?.discountCode.code}
        note={note}
        isProcessing={createOrder.isPending}
        onConfirm={handleConfirmOrder}
      />

      {/* Bill Receipt */}
      {completedOrder && (
        <BillReceiptView
          open={billOpen}
          orderId={completedOrder.orderId}
          lines={lines}
          subtotal={subtotal}
          discountAmount={discountAmount}
          taxBreakdown={[]}
          taxTotal={0}
          totalAmount={totalAmount}
          paymentMode={completedOrder.paymentMode}
          customerName={selectedCustomer?.name}
          note={note}
          onNewSale={handleNewSale}
        />
      )}
    </div>
  );
}
