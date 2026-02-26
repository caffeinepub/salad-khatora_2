import React, { useState } from 'react';
import {
  useSubscriptions,
  useCreateSubscription,
  usePauseSubscription,
  useResumeSubscription,
  useCancelSubscription,
  useCustomers,
  useMenuItems,
  SubscriptionStatus,
} from '../hooks/useQueries';
import type { Subscription, MenuItem } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Search, Pause, Play, X, CalendarCheck, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString();
}

function formatCurrency(v: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
}

function getStatusBadge(status: SubscriptionStatus) {
  switch (status) {
    case SubscriptionStatus.active:
      return <Badge className="bg-green-100 text-green-800 border-0">Active</Badge>;
    case SubscriptionStatus.paused:
      return <Badge className="bg-yellow-100 text-yellow-800 border-0">Paused</Badge>;
    case SubscriptionStatus.cancelled:
      return <Badge variant="secondary">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

interface SubForm {
  customerId: string;
  planName: string;
  menuItemIds: number[];
  frequencyDays: string;
  startDate: string;
}

const emptyForm: SubForm = {
  customerId: '',
  planName: '',
  menuItemIds: [],
  frequencyDays: '7',
  startDate: new Date().toISOString().split('T')[0],
};

export default function SubscriptionsPage() {
  const { data: subscriptions = [], isLoading } = useSubscriptions();
  const { data: customers = [] } = useCustomers();
  const { data: menuItems = [] } = useMenuItems();
  const createSubscription = useCreateSubscription();
  const pauseSubscription = usePauseSubscription();
  const resumeSubscription = useResumeSubscription();
  const cancelSubscription = useCancelSubscription();

  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Subscription | null>(null);
  const [form, setForm] = useState<SubForm>(emptyForm);

  const customerMap = new Map(customers.map(c => [c.id.toString(), c.name]));
  const menuItemMap = new Map(menuItems.map(m => [m.id.toString(), m.name]));

  const filtered = subscriptions.filter(s => {
    const q = search.toLowerCase();
    const customerName = customerMap.get(s.customerId.toString()) ?? '';
    return (
      customerName.toLowerCase().includes(q) ||
      s.planName.toLowerCase().includes(q)
    );
  });

  const calcAutoPrice = (ids: number[]) =>
    ids.reduce((sum, id) => {
      const item = menuItems.find(m => m.id === id);
      return sum + (item?.sellingPrice ?? 0);
    }, 0);

  const toggleMenuItem = (id: number) => {
    setForm(f => ({
      ...f,
      menuItemIds: f.menuItemIds.includes(id)
        ? f.menuItemIds.filter(i => i !== id)
        : [...f.menuItemIds, id],
    }));
  };

  const handleCreate = async () => {
    if (!form.customerId || !form.planName.trim() || form.menuItemIds.length === 0) return;
    const autoPrice = calcAutoPrice(form.menuItemIds);
    const startDate = new Date(form.startDate).getTime();
    const frequencyDays = parseInt(form.frequencyDays) || 7;
    const nextRenewalDate = startDate + frequencyDays * 24 * 60 * 60 * 1000;
    try {
      await createSubscription.mutateAsync({
        customerId: parseInt(form.customerId),
        planName: form.planName.trim(),
        menuItemIds: form.menuItemIds,
        frequencyDays,
        startDate,
        nextRenewalDate,
        status: SubscriptionStatus.active,
        totalPrice: autoPrice,
      });
      setShowAdd(false);
      setForm(emptyForm);
    } catch {
      // handled by mutation
    }
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    await cancelSubscription.mutateAsync(cancelTarget.id);
    setCancelTarget(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Subscriptions</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage recurring customer subscriptions</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Subscription
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search subscriptions..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Next Renewal</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                    {search ? 'No subscriptions match your search.' : 'No subscriptions yet.'}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(sub => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">
                      {customerMap.get(sub.customerId.toString()) ?? `Customer #${sub.customerId}`}
                    </TableCell>
                    <TableCell>{sub.planName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {sub.menuItemIds.map(id => menuItemMap.get(id.toString()) ?? `#${id}`).join(', ')}
                    </TableCell>
                    <TableCell>Every {sub.frequencyDays}d</TableCell>
                    <TableCell className="text-sm">{formatDate(sub.nextRenewalDate)}</TableCell>
                    <TableCell>{formatCurrency(sub.totalPrice)}</TableCell>
                    <TableCell>{getStatusBadge(sub.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {sub.status === SubscriptionStatus.active && (
                          <Button variant="ghost" size="icon" onClick={() => pauseSubscription.mutate(sub.id)} title="Pause">
                            <Pause className="w-4 h-4" />
                          </Button>
                        )}
                        {sub.status === SubscriptionStatus.paused && (
                          <Button variant="ghost" size="icon" onClick={() => resumeSubscription.mutate(sub.id)} title="Resume">
                            <Play className="w-4 h-4" />
                          </Button>
                        )}
                        {sub.status !== SubscriptionStatus.cancelled && (
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setCancelTarget(sub)} title="Cancel">
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Subscription</DialogTitle>
            <DialogDescription>Create a new recurring subscription for a customer.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-1">
              <Label>Customer *</Label>
              <Select value={form.customerId} onValueChange={v => setForm(f => ({ ...f, customerId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select customer..." /></SelectTrigger>
                <SelectContent>
                  {customers.map(c => (
                    <SelectItem key={c.id.toString()} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="plan-name">Plan Name *</Label>
              <Input id="plan-name" value={form.planName} onChange={e => setForm(f => ({ ...f, planName: e.target.value }))} placeholder="e.g. Weekly Salad Box" />
            </div>
            <div className="space-y-1">
              <Label>Menu Items *</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-border rounded-lg p-2">
                {menuItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`sub-item-${item.id}`}
                        checked={form.menuItemIds.includes(item.id)}
                        onCheckedChange={() => toggleMenuItem(item.id)}
                      />
                      <Label htmlFor={`sub-item-${item.id}`} className="text-sm cursor-pointer">{item.name}</Label>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatCurrency(item.sellingPrice)}</span>
                  </div>
                ))}
                {menuItems.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">No menu items available.</p>
                )}
              </div>
              {form.menuItemIds.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Total: {formatCurrency(calcAutoPrice(form.menuItemIds))}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="freq-days">Frequency (days) *</Label>
                <Input id="freq-days" type="number" min={1} value={form.frequencyDays} onChange={e => setForm(f => ({ ...f, frequencyDays: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="start-date">Start Date *</Label>
                <Input id="start-date" type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button
              onClick={handleCreate}
              disabled={createSubscription.isPending || !form.customerId || !form.planName.trim() || form.menuItemIds.length === 0}
            >
              {createSubscription.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation */}
      <AlertDialog open={!!cancelTarget} onOpenChange={open => !open && setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the <strong>{cancelTarget?.planName}</strong> subscription? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleCancel}
              disabled={cancelSubscription.isPending}
            >
              {cancelSubscription.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Cancel Subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
