import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, ShoppingBag } from "lucide-react";
import type { MenuItem } from "../hooks/useQueries";
import type { TaxBreakdown, PaymentMode } from "../backend";

interface CartLine {
  menuItem: MenuItem;
  quantity: number;
}

interface BillReceiptViewProps {
  open: boolean;
  orderId: bigint | null;
  lines: CartLine[];
  subtotal: number;
  discountAmount: number;
  taxBreakdown: TaxBreakdown[];
  taxTotal: number;
  totalAmount: number;
  paymentMode: PaymentMode | null;
  customerName?: string;
  note?: string;
  onNewSale: () => void;
}

function formatCurrency(amount: number) {
  return `₹${amount.toFixed(2)}`;
}

function paymentModeLabel(mode: PaymentMode | null): string {
  if (!mode) return "—";
  switch (mode.__kind__) {
    case "cash": return "Cash";
    case "card": return "Card";
    case "upi": return "UPI / Online";
    case "other": return mode.other;
    default: return "—";
  }
}

export default function BillReceiptView({
  open,
  orderId,
  lines,
  subtotal,
  discountAmount,
  taxBreakdown,
  taxTotal,
  totalAmount,
  paymentMode,
  customerName,
  note,
  onNewSale,
}: BillReceiptViewProps) {
  const handlePrint = () => window.print();

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-sm no-print">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-primary" />
            Order Confirmed!
          </DialogTitle>
        </DialogHeader>

        {/* Receipt */}
        <div id="bill-receipt" className="font-mono text-xs space-y-2 border border-border rounded-lg p-4 bg-card">
          {/* Header */}
          <div className="text-center space-y-0.5">
            <p className="font-bold text-base text-foreground">🥗 Salad Khatora</p>
            <p className="text-muted-foreground">Fresh & Healthy</p>
            <p className="text-muted-foreground">{dateStr} {timeStr}</p>
            {orderId && (
              <p className="text-muted-foreground">Order #{orderId.toString()}</p>
            )}
          </div>

          <div className="border-t border-dashed border-border" />

          {/* Customer */}
          {customerName && (
            <p className="text-foreground">Customer: {customerName}</p>
          )}

          {/* Items */}
          <div className="space-y-1">
            {lines.map((line, idx) => (
              <div key={idx} className="flex justify-between gap-2">
                <span className="flex-1 truncate text-foreground">
                  {line.menuItem.name} × {line.quantity} @ {formatCurrency(line.menuItem.sellingPrice ?? line.menuItem.price)}
                </span>
                <span className="shrink-0 text-foreground">
                  {formatCurrency((line.menuItem.sellingPrice ?? line.menuItem.price) * line.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-border" />

          {/* Totals */}
          <div className="space-y-0.5">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span>Discount</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            {taxBreakdown.map((tb, i) => (
              <div key={i} className="flex justify-between text-muted-foreground">
                <span>{tb.name} ({tb.rate}%)</span>
                <span>{formatCurrency(tb.amount)}</span>
              </div>
            ))}
            {taxTotal > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Total Tax</span>
                <span>{formatCurrency(taxTotal)}</span>
              </div>
            )}
          </div>

          <div className="border-t border-border" />

          <div className="flex justify-between font-bold text-sm text-foreground">
            <span>TOTAL</span>
            <span>{formatCurrency(totalAmount)}</span>
          </div>

          <div className="flex justify-between text-muted-foreground">
            <span>Payment</span>
            <span>{paymentModeLabel(paymentMode)}</span>
          </div>

          {note && (
            <p className="text-muted-foreground">Note: {note}</p>
          )}

          <div className="border-t border-dashed border-border" />
          <p className="text-center text-muted-foreground">Thank you! Visit again 🙏</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={handlePrint}>
            <Printer size={16} className="mr-2" />
            Print Bill
          </Button>
          <Button className="flex-1" onClick={onNewSale}>
            New Sale
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
