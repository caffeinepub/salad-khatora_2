import React, { useState } from 'react';
import {
  usePurchaseOrders,
  useUpdatePurchaseOrderStatus,
  useAutoGeneratePurchaseOrders,
  PurchaseOrderStatus,
} from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ShoppingBag, Zap, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function PurchaseOrdersPage() {
  const { data: orders = [], isLoading } = usePurchaseOrders();
  const updateStatus = useUpdatePurchaseOrderStatus();
  const autoGenerate = useAutoGeneratePurchaseOrders();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case PurchaseOrderStatus.pending:
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case PurchaseOrderStatus.received:
        return <Badge className="bg-green-100 text-green-800 border-green-200">Received</Badge>;
      case PurchaseOrderStatus.cancelled:
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    if (newStatus === PurchaseOrderStatus.pending ||
        newStatus === PurchaseOrderStatus.received ||
        newStatus === PurchaseOrderStatus.cancelled) {
      await updateStatus.mutateAsync({ id, status: newStatus });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Purchase Orders</h1>
        <Button
          variant="outline"
          onClick={() => autoGenerate.mutate()}
          disabled={autoGenerate.isPending}
        >
          {autoGenerate.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Zap className="mr-2 h-4 w-4" />
          )}
          Auto-Generate
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No purchase orders yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map(order => (
                <TableRow key={order.id.toString()}>
                  <TableCell className="font-mono text-xs">#{order.id}</TableCell>
                  <TableCell className="font-medium">{order.supplierName}</TableCell>
                  <TableCell>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {order.status === PurchaseOrderStatus.pending ? (
                      <Select
                        value={order.status}
                        onValueChange={val => handleStatusChange(order.id, val)}
                      >
                        <SelectTrigger className="w-36 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={PurchaseOrderStatus.pending}>Pending</SelectItem>
                          <SelectItem value={PurchaseOrderStatus.received}>Received</SelectItem>
                          <SelectItem value={PurchaseOrderStatus.cancelled}>Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-xs text-muted-foreground capitalize">{order.status}</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
