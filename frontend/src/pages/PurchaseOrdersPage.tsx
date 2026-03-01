import React, { useState } from 'react';
import {
  ClipboardList,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  usePurchaseOrders,
  useCreatePurchaseOrder,
  useUpdatePurchaseOrderStatus,
  useDeletePurchaseOrder,
  useSuppliers,
  useIngredients,
  PurchaseOrder,
  PurchaseOrderStatus,
} from '../hooks/useQueries';

// PurchaseOrderStatus in useQueries is: 'pending' | 'confirmed' | 'delivered' | 'cancelled'
// Map display labels to these values
const statusConfig: Record<
  PurchaseOrderStatus,
  { label: string; icon: React.ReactNode; variant: 'default' | 'secondary' | 'outline' | 'destructive' }
> = {
  pending: { label: 'Pending', icon: <Clock size={12} />, variant: 'secondary' },
  confirmed: { label: 'Confirmed', icon: <Truck size={12} />, variant: 'default' },
  delivered: { label: 'Delivered', icon: <CheckCircle size={12} />, variant: 'outline' },
  cancelled: { label: 'Cancelled', icon: <XCircle size={12} />, variant: 'destructive' },
};

const ALL_STATUSES: PurchaseOrderStatus[] = ['pending', 'confirmed', 'delivered', 'cancelled'];

export default function PurchaseOrdersPage() {
  const { data: orders = [], isLoading } = usePurchaseOrders();
  const { data: suppliers = [] } = useSuppliers();
  const { data: ingredients = [] } = useIngredients();
  const createOrder = useCreatePurchaseOrder();
  const updateStatus = useUpdatePurchaseOrderStatus();
  const deleteOrder = useDeletePurchaseOrder();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Form state
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [orderItems, setOrderItems] = useState<
    { ingredientId: number; quantity: number; costPerUnit: number }[]
  >([]);
  const [expectedDeliveryStr, setExpectedDeliveryStr] = useState('');

  const resetForm = () => {
    setSelectedSupplierId('');
    setOrderItems([]);
    setExpectedDeliveryStr('');
  };

  const handleAddItem = () => {
    setOrderItems(prev => [
      ...prev,
      { ingredientId: 0, quantity: 1, costPerUnit: 0 },
    ]);
  };

  const handleRemoveItem = (idx: number) => {
    setOrderItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleItemChange = (
    idx: number,
    field: 'ingredientId' | 'quantity' | 'costPerUnit',
    value: number
  ) => {
    setOrderItems(prev =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const updated = { ...item, [field]: value };
        if (field === 'ingredientId') {
          const ing = ingredients.find(ing => ing.id === value);
          if (ing) {
            updated.costPerUnit = ing.costPerUnit;
          }
        }
        return updated;
      })
    );
  };

  const handleSubmit = async () => {
    const supplier = suppliers.find(s => s.id === Number(selectedSupplierId));
    if (!supplier || orderItems.length === 0) return;

    const items = orderItems
      .filter(item => item.ingredientId > 0)
      .map(item => {
        const ing = ingredients.find(i => i.id === item.ingredientId);
        return {
          ingredientId: item.ingredientId,
          ingredientName: ing?.name ?? 'Unknown',
          quantity: item.quantity,
          unit: ing?.unit ?? '',
          costPerUnit: item.costPerUnit,
        };
      });

    const totalCost = items.reduce((sum, i) => sum + i.costPerUnit * i.quantity, 0);
    const expectedDelivery = expectedDeliveryStr
      ? new Date(expectedDeliveryStr).getTime()
      : undefined;

    await createOrder.mutateAsync({
      supplierId: supplier.id,
      supplierName: supplier.name,
      items,
      status: 'pending',
      totalCost,
      expectedDelivery,
    });

    resetForm();
    setShowAddDialog(false);
  };

  const sortedOrders = [...orders].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList size={24} className="text-primary" />
            Purchase Orders
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage supplier purchase orders and track deliveries.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus size={16} className="mr-2" />
            New Order
          </Button>
        </div>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="animate-spin text-primary" size={28} />
        </div>
      ) : sortedOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Package size={40} className="text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No purchase orders yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedOrders.map(order => {
            const cfg = statusConfig[order.status] ?? statusConfig.pending;
            const isExpanded = expandedId === order.id;

            return (
              <Card key={order.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-base">
                        PO #{order.id} — {order.supplierName}
                      </CardTitle>
                      <Badge variant={cfg.variant} className="flex items-center gap-1 text-xs">
                        {cfg.icon}
                        {cfg.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-primary">
                        ₹{order.totalCost.toFixed(2)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setExpandedId(isExpanded ? null : order.id)}
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => deleteOrder.mutate(order.id)}
                        disabled={deleteOrder.isPending}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Created: {new Date(order.createdAt).toLocaleDateString()}
                    {order.expectedDelivery && (
                      <> · Expected: {new Date(order.expectedDelivery).toLocaleDateString()}</>
                    )}
                  </p>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="space-y-3">
                    {/* Items */}
                    <div className="space-y-1">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span>{item.ingredientName}</span>
                          <span className="text-muted-foreground">
                            {item.quantity} {item.unit} · ₹{(item.costPerUnit * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Status Update */}
                    <div className="flex items-center gap-2 pt-2 border-t border-border">
                      <span className="text-xs text-muted-foreground">Update status:</span>
                      <div className="flex gap-1 flex-wrap">
                        {ALL_STATUSES.filter(s => s !== order.status).map(s => (
                          <Button
                            key={s}
                            variant="outline"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => updateStatus.mutate({ id: order.id, status: s })}
                            disabled={updateStatus.isPending}
                          >
                            {statusConfig[s].label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={open => { setShowAddDialog(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Purchase Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Supplier *</Label>
              <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier..." />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Expected Delivery (optional)</Label>
              <Input
                type="date"
                value={expectedDeliveryStr}
                onChange={e => setExpectedDeliveryStr(e.target.value)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Order Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                  <Plus size={14} className="mr-1" /> Add Item
                </Button>
              </div>
              <div className="space-y-2">
                {orderItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Select
                        value={item.ingredientId ? item.ingredientId.toString() : ''}
                        onValueChange={val => handleItemChange(idx, 'ingredientId', Number(val))}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Ingredient..." />
                        </SelectTrigger>
                        <SelectContent>
                          {ingredients.map(ing => (
                            <SelectItem key={ing.id} value={ing.id.toString()}>{ing.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-20">
                      <Input
                        type="number"
                        min={1}
                        className="h-8 text-sm"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={e => handleItemChange(idx, 'quantity', Number(e.target.value))}
                      />
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        className="h-8 text-sm"
                        placeholder="Cost/unit"
                        value={item.costPerUnit}
                        onChange={e => handleItemChange(idx, 'costPerUnit', Number(e.target.value))}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive shrink-0"
                      onClick={() => handleRemoveItem(idx)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
                {orderItems.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    No items added. Click "Add Item" to start.
                  </p>
                )}
              </div>
              {orderItems.length > 0 && (
                <p className="text-sm font-medium mt-2">
                  Total: ₹{orderItems.reduce((sum, i) => sum + i.costPerUnit * i.quantity, 0).toFixed(2)}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); }}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createOrder.isPending || !selectedSupplierId || orderItems.filter(i => i.ingredientId > 0).length === 0}
            >
              {createOrder.isPending ? (
                <><Loader2 size={14} className="animate-spin mr-2" />Creating...</>
              ) : 'Create Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
