import React, { useState } from 'react';
import { CreditCard, Banknote, Smartphone, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { MenuItem } from '../hooks/useQueries';
import type { DiscountCode } from '../backend';
import type { Customer } from '../backend';

interface OrderLine {
  menuItem: MenuItem;
  quantity: number;
}

interface AppliedDiscount {
  discountAmount: number;
  discountCode: DiscountCode;
}

export type PaymentModeKey = 'cash' | 'card' | 'upi';

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lines: OrderLine[];
  subtotal: number;
  discountAmount: number;
  total: number;
  appliedDiscount: AppliedDiscount | null;
  note: string;
  customer: Customer | null;
  isProcessing: boolean;
  onConfirm: (paymentMode: PaymentModeKey) => void;
}

const PAYMENT_OPTIONS: { key: PaymentModeKey; label: string; icon: React.ReactNode }[] = [
  { key: 'cash', label: 'Cash', icon: <Banknote className="h-5 w-5" /> },
  { key: 'card', label: 'Card', icon: <CreditCard className="h-5 w-5" /> },
  { key: 'upi', label: 'UPI / Online', icon: <Smartphone className="h-5 w-5" /> },
];

function formatCurrency(v: number) {
  return `$${v.toFixed(2)}`;
}

export default function CheckoutDialog({
  open,
  onOpenChange,
  lines,
  subtotal,
  discountAmount,
  total,
  appliedDiscount,
  note,
  customer,
  isProcessing,
  onConfirm,
}: CheckoutDialogProps) {
  const [selectedPayment, setSelectedPayment] = useState<PaymentModeKey | null>(null);

  const handleConfirm = () => {
    if (!selectedPayment) return;
    onConfirm(selectedPayment);
  };

  const handleOpenChange = (open: boolean) => {
    if (!isProcessing) {
      onOpenChange(open);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-heading">Order Summary</DialogTitle>
        </DialogHeader>

        {/* Customer */}
        {customer && (
          <div className="text-sm text-muted-foreground">
            Customer: <span className="font-medium text-foreground">{customer.name}</span>
          </div>
        )}

        {/* Items */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Items</p>
          <div className="space-y-1">
            {lines.map(line => (
              <div key={line.menuItem.id} className="flex justify-between text-sm">
                <span className="flex-1 truncate pr-2">
                  {line.menuItem.name}
                  <span className="text-muted-foreground ml-1">× {line.quantity}</span>
                </span>
                <span className="font-medium tabular-nums">
                  {formatCurrency(line.menuItem.sellingPrice * line.quantity)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Totals */}
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {appliedDiscount && (
            <div className="flex justify-between text-green-600 dark:text-green-400">
              <span>Discount ({appliedDiscount.discountCode.code})</span>
              <span>-{formatCurrency(discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base pt-1">
            <span>Total</span>
            <span className="text-primary">{formatCurrency(total)}</span>
          </div>
        </div>

        {note && (
          <div className="text-xs text-muted-foreground bg-muted rounded-md px-3 py-2">
            Note: {note}
          </div>
        )}

        <Separator />

        {/* Payment Mode */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Payment Mode <span className="text-destructive">*</span>
          </p>
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_OPTIONS.map(opt => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setSelectedPayment(opt.key)}
                className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  selectedPayment === opt.key
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground'
                }`}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>
          {!selectedPayment && (
            <p className="text-xs text-muted-foreground">Please select a payment mode to continue.</p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedPayment || isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              `Confirm Order · ${formatCurrency(total)}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
