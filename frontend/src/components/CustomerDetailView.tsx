import { useState } from "react";
import { ArrowLeft, Gift, ShoppingBag, Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useCustomers,
  useLoyaltyBalance,
  useLoyaltyTransactions,
  useRedeemLoyaltyPoints,
  useCustomerOrderHistory,
} from "../hooks/useQueries";

interface CustomerDetailViewProps {
  customerId: bigint;
  onBack: () => void;
}

export default function CustomerDetailView({ customerId, onBack }: CustomerDetailViewProps) {
  const { data: customers = [] } = useCustomers();
  const customer = customers.find((c) => c.id === customerId);

  const { data: loyaltyBalance = BigInt(0) } = useLoyaltyBalance(customerId);
  const { data: loyaltyTxns = [] } = useLoyaltyTransactions(customerId);
  const { data: orderHistory = [] } = useCustomerOrderHistory(customerId);
  const redeemPoints = useRedeemLoyaltyPoints();

  const [showRedeemDialog, setShowRedeemDialog] = useState(false);
  const [redeemPointsInput, setRedeemPointsInput] = useState("");
  const [redeemError, setRedeemError] = useState<string | null>(null);

  const handleRedeem = async () => {
    setRedeemError(null);
    const pts = Number(redeemPointsInput);
    if (!pts || pts <= 0) {
      setRedeemError("Enter a valid number of points");
      return;
    }
    if (BigInt(pts) > loyaltyBalance) {
      setRedeemError("Insufficient loyalty points");
      return;
    }
    try {
      await redeemPoints.mutateAsync({
        customerId,
        points: BigInt(pts),
        discountAmount: pts * 0.1, // 1 point = ₹0.10
      });
      setShowRedeemDialog(false);
      setRedeemPointsInput("");
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      setRedeemError(msg.replace(/^.*?Reject text:\s*/i, "").trim());
    }
  };

  if (!customer) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft size={16} className="mr-2" />
          Back
        </Button>
        <p className="text-muted-foreground">Customer not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Back */}
      <Button variant="ghost" onClick={onBack} className="-ml-2">
        <ArrowLeft size={16} className="mr-2" />
        Back to Customers
      </Button>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            {customer.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="text-muted-foreground w-24">Mobile:</span>
            <span className="text-foreground">{customer.mobileNo}</span>
          </div>
          {customer.email && (
            <div className="flex gap-2">
              <span className="text-muted-foreground w-24">Email:</span>
              <span className="text-foreground">{customer.email}</span>
            </div>
          )}
          {customer.address && (
            <div className="flex gap-2">
              <span className="text-muted-foreground w-24">Address:</span>
              <span className="text-foreground">{customer.address}</span>
            </div>
          )}
          {customer.preference && (
            <div className="flex gap-2">
              <span className="text-muted-foreground w-24">Preference:</span>
              <span className="text-foreground">{customer.preference}</span>
            </div>
          )}
          <div className="flex gap-2">
            <span className="text-muted-foreground w-24">Member since:</span>
            <span className="text-foreground">
              {new Date(Number(customer.createdAt) / 1_000_000).toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Loyalty Points */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Star size={16} className="text-primary" />
            Loyalty Points
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-primary">{loyaltyBalance.toString()}</p>
              <p className="text-sm text-muted-foreground">points available</p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowRedeemDialog(true)}
              disabled={loyaltyBalance === BigInt(0)}
            >
              <Gift size={16} className="mr-2" />
              Redeem
            </Button>
          </div>

          {/* Loyalty Transactions */}
          {loyaltyTxns.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Transaction History
              </p>
              {loyaltyTxns.slice(0, 5).map((txn) => (
                <div key={txn.id.toString()} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{txn.reason}</span>
                  <span
                    className={
                      Number(txn.points) >= 0
                        ? "text-green-600 dark:text-green-400 font-medium"
                        : "text-destructive font-medium"
                    }
                  >
                    {Number(txn.points) >= 0 ? "+" : ""}{txn.points.toString()} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingBag size={16} className="text-primary" />
            Order History
            <Badge variant="secondary" className="ml-auto">{orderHistory.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orderHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {orderHistory.map((order) => (
                <div
                  key={order.id.toString()}
                  className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-foreground">Order #{order.id.toString()}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(Number(order.createdAt) / 1_000_000).toLocaleDateString()} ·{" "}
                      {order.items.length} item(s)
                    </p>
                  </div>
                  <span className="font-semibold text-foreground">
                    ₹{order.totalAmount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Redeem Dialog */}
      <Dialog open={showRedeemDialog} onOpenChange={setShowRedeemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redeem Loyalty Points</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Available: <span className="font-semibold text-foreground">{loyaltyBalance.toString()} points</span>
              {" "}(1 point = ₹0.10 discount)
            </p>
            <div className="space-y-1.5">
              <Label>Points to Redeem</Label>
              <Input
                type="number"
                min={1}
                max={Number(loyaltyBalance)}
                value={redeemPointsInput}
                onChange={(e) => setRedeemPointsInput(e.target.value)}
                placeholder="Enter points"
              />
            </div>
            {redeemPointsInput && Number(redeemPointsInput) > 0 && (
              <p className="text-sm text-green-600 dark:text-green-400">
                Discount: ₹{(Number(redeemPointsInput) * 0.1).toFixed(2)}
              </p>
            )}
            {redeemError && (
              <p className="text-sm text-destructive">{redeemError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRedeemDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRedeem}
              disabled={redeemPoints.isPending || !redeemPointsInput}
            >
              {redeemPoints.isPending ? (
                <><Loader2 size={16} className="animate-spin mr-2" />Redeeming...</>
              ) : "Redeem Points"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
