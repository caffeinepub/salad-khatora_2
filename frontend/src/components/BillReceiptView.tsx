import React, { useRef } from 'react';
import { Printer, CheckCircle2, ShoppingBag } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { TaxBreakdown } from '../backend';
import type { PaymentModeKey } from './CheckoutDialog';
import type { MenuItem } from '../hooks/useQueries';
import type { Customer } from '../backend';

interface OrderLine {
  menuItem: MenuItem;
  quantity: number;
}

interface AppliedDiscount {
  discountAmount: number;
  discountCode: { code: string };
}

interface BillReceiptViewProps {
  open: boolean;
  orderId: bigint;
  lines: OrderLine[];
  subtotal: number;
  discountAmount: number;
  total: number;
  taxBreakdown: TaxBreakdown[];
  taxTotal: number;
  appliedDiscount: AppliedDiscount | null;
  note: string;
  customer: Customer | null;
  paymentMode: PaymentModeKey;
  createdAt: Date;
  onNewSale: () => void;
}

function formatCurrency(v: number) {
  return `$${v.toFixed(2)}`;
}

function paymentModeLabel(mode: PaymentModeKey): string {
  switch (mode) {
    case 'cash': return 'Cash';
    case 'card': return 'Card';
    case 'upi': return 'UPI / Online';
    default: return mode;
  }
}

export default function BillReceiptView({
  open,
  orderId,
  lines,
  subtotal,
  discountAmount,
  total,
  taxBreakdown,
  taxTotal,
  appliedDiscount,
  note,
  customer,
  paymentMode,
  createdAt,
  onNewSale,
}: BillReceiptViewProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = createdAt.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-sm max-h-[95vh] overflow-y-auto p-0"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-5 w-5" />
            <DialogTitle className="text-base font-heading">Order Confirmed!</DialogTitle>
          </div>
        </DialogHeader>

        {/* Printable receipt area */}
        <div ref={printRef} id="bill-receipt" className="px-6 py-4 space-y-4">
          {/* Header */}
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              <span className="font-heading font-bold text-lg">KitchenOS</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {formattedDate} · {formattedTime}
            </p>
            <p className="text-xs font-mono text-muted-foreground">
              Order #{orderId.toString()}
            </p>
          </div>

          <Separator />

          {/* Customer */}
          {customer && (
            <div className="text-sm">
              <span className="text-muted-foreground">Customer: </span>
              <span className="font-medium">{customer.name}</span>
            </div>
          )}

          {/* Items */}
          <div className="space-y-1.5">
            {lines.map(line => (
              <div key={line.menuItem.id} className="flex justify-between text-sm">
                <span className="flex-1 pr-2">
                  {line.menuItem.name}
                  <span className="text-muted-foreground text-xs ml-1">
                    × {line.quantity} @ {formatCurrency(line.menuItem.sellingPrice)}
                  </span>
                </span>
                <span className="tabular-nums font-medium">
                  {formatCurrency(line.menuItem.sellingPrice * line.quantity)}
                </span>
              </div>
            ))}
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>

            {appliedDiscount && (
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span>Discount ({appliedDiscount.discountCode.code})</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}

            {taxBreakdown.length > 0 && taxBreakdown.map((tax, i) => (
              <div key={i} className="flex justify-between text-muted-foreground">
                <span>{tax.name} ({tax.rate}%)</span>
                <span>{formatCurrency(tax.amount)}</span>
              </div>
            ))}

            {taxTotal > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Tax Total</span>
                <span>{formatCurrency(taxTotal)}</span>
              </div>
            )}

            <Separator />

            <div className="flex justify-between font-bold text-base">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Payment Mode */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Payment</span>
            <span className="font-semibold">{paymentModeLabel(paymentMode)}</span>
          </div>

          {/* Note */}
          {note && (
            <div className="text-xs text-muted-foreground bg-muted rounded px-3 py-2">
              Note: {note}
            </div>
          )}

          <Separator />

          <p className="text-center text-xs text-muted-foreground">
            Thank you for your order!
          </p>
        </div>

        {/* Action buttons — hidden during print */}
        <div className="no-print px-6 pb-6 flex gap-2">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={handlePrint}
          >
            <Printer className="h-4 w-4" />
            Print Bill
          </Button>
          <Button
            className="flex-1"
            onClick={onNewSale}
          >
            New Sale
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
