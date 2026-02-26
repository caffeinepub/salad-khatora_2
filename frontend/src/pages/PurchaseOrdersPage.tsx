import { format } from 'date-fns';
import { ShoppingBag, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { usePurchaseOrders, useUpdatePurchaseOrderStatus } from '../hooks/useQueries';
import { PurchaseOrderStatus } from '../backend';

function StatusBadge({ status }: { status: PurchaseOrderStatus }) {
  if (status === PurchaseOrderStatus.pending) {
    return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100">Pending</Badge>;
  }
  if (status === PurchaseOrderStatus.received) {
    return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">Received</Badge>;
  }
  return <Badge variant="secondary">Cancelled</Badge>;
}

export default function PurchaseOrdersPage() {
  const { data: orders, isLoading, error } = usePurchaseOrders();
  const updateStatus = useUpdatePurchaseOrderStatus();

  const handleStatusChange = async (id: bigint, status: string) => {
    let newStatus: PurchaseOrderStatus;
    if (status === 'received') newStatus = PurchaseOrderStatus.received;
    else if (status === 'cancelled') newStatus = PurchaseOrderStatus.cancelled;
    else newStatus = PurchaseOrderStatus.pending;

    try {
      await updateStatus.mutateAsync({ id, status: newStatus });
      toast.success('Order status updated');
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to update status');
    }
  };

  const sortedOrders = [...(orders ?? [])].sort((a, b) =>
    Number(b.createdAt) - Number(a.createdAt)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Purchase Orders</h1>
          <p className="text-muted-foreground text-sm mt-1">Track and manage purchase orders from suppliers</p>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <ShoppingBag className="h-5 w-5" />
          <span className="text-sm font-medium">{orders?.length ?? 0} orders</span>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Order ID</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Update Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-destructive py-8">
                  Failed to load purchase orders
                </TableCell>
              </TableRow>
            ) : sortedOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                  <div className="flex flex-col items-center gap-2">
                    <ShoppingBag className="h-8 w-8 opacity-30" />
                    <p>No purchase orders yet.</p>
                    <p className="text-xs">Use the Suppliers page to auto-generate orders for low-stock items.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sortedOrders.map(order => (
                <TableRow key={order.id.toString()} className="hover:bg-muted/30">
                  <TableCell className="font-mono text-sm font-medium">#{order.id.toString()}</TableCell>
                  <TableCell className="font-medium">{order.supplierName}</TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(Number(order.createdAt) / 1_000_000), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    {order.status === PurchaseOrderStatus.pending ? (
                      <Select
                        defaultValue="pending"
                        onValueChange={val => handleStatusChange(order.id, val)}
                        disabled={updateStatus.isPending}
                      >
                        <SelectTrigger className="w-36 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="received">Mark Received</SelectItem>
                          <SelectItem value="cancelled">Mark Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Finalized</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
