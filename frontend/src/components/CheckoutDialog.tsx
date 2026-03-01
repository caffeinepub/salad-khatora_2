import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, Banknote, Smartphone } from "lucide-react";
import type { MenuItem } from "../hooks/useQueries";
import type { TaxBreakdown, PaymentMode } from "../backend";

interface CartLine {
  menuItem: MenuItem;
  quantity: number;
}

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lines: CartLine[];
  subtotal: number;
  discountAmount: number;
  taxBreakdown: TaxBreakdown[];
  taxTotal: number;
  totalAmount: number;
  customerName?: string;
  discountCode?: string;
  note?: string;
  isProcessing: boolean;
  onConfirm: (paymentMode: PaymentMode) => void;
}

function formatCurrency(amount: number) {
  return `₹${amount.toFixed(2)}`;
}

type PaymentOption = { label: string; kind: PaymentMode["__kind__"]; icon: React.ReactNode };

const paymentOptions: PaymentOption[] = [
  { label: "Cash", kind: "cash", icon: <Banknote size={18} /> },
  { label: "Card", kind: "card", icon: <CreditCard size={18} /> },
  { label: "UPI / Online", kind: "upi", icon: <Smartphone size={18} /> },
];

export default function CheckoutDialog({
  open,
  onOpenChange,
  lines,
  subtotal,
  discountAmount,
  taxBreakdown,
  taxTotal,
  totalAmount,
  customerName,
  discountCode,
  note,
  isProcessing,
  onConfirm,
}: CheckoutDialogProps) {
  const [selectedPayment, setSelectedPayment] = useState<PaymentMode["__kind__"] | null>(null);

  const handleConfirm = () => {
    if (!selectedPayment) return;
    let mode: PaymentMode;
    if (selectedPayment === "cash") mode = { __kind__: "cash", cash: null };
    else if (selectedPayment === "card") mode = { __kind__: "card", card: null };
    else mode = { __kind__: "upi", upi: null };
    onConfirm(mode);
  };

  return (
    <Dialog open={open} onOpenChange={isProcessing ? undefined : onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confirm Order</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Customer */}
          {customerName && (
            <div className="text-sm text-muted-foreground">
              Customer: <span className="text-foreground font-medium">{customerName}</span>
            </div>
          )}

          {/* Items */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Items</p>
            {lines.map((line, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-foreground">
                  {line.menuItem.name} × {line.quantity}
                </span>
                <span className="text-foreground font-medium">
                  {formatCurrency((line.menuItem.sellingPrice ?? line.menuItem.price) * line.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-border pt-3 space-y-1">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                <span>Discount {discountCode ? `(${discountCode})` : ""}</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            {taxBreakdown.map((tb, i) => (
              <div key={i} className="flex justify-between text-sm text-muted-foreground">
                <span>{tb.name} ({tb.rate}%)</span>
                <span>{formatCurrency(tb.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-base text-foreground border-t border-border pt-2 mt-1">
              <span>Total</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          {/* Note */}
          {note && (
            <p className="text-sm text-muted-foreground">Note: {note}</p>
          )}

          {/* Payment Mode */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Payment Method <span className="text-destructive">*</span>
            </p>
            <div className="grid grid-cols-3 gap-2">
              {paymentOptions.map((opt) => (
                <button
                  key={opt.kind}
                  type="button"
                  onClick={() => setSelectedPayment(opt.kind)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-colors text-sm font-medium ${
                    selectedPayment === opt.kind
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  }`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
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
                <Loader2 size={16} className="animate-spin mr-2" />
                Processing...
              </>
            ) : (
              "Confirm Order"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
