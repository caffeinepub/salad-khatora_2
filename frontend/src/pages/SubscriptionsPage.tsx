import { useState, useMemo } from 'react';
import {
  useSubscriptions,
  useCustomers,
  useMenuItems,
  useCreateSubscription,
  usePauseSubscription,
  useResumeSubscription,
  useCancelSubscription,
  Subscription,
  SubscriptionStatus,
} from '../hooks/useQueries';
import {
  Plus,
  Loader2,
  CalendarClock,
  Pause,
  Play,
  XCircle,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case SubscriptionStatus.active:
      return <Badge className="bg-primary/15 text-primary border-primary/30 hover:bg-primary/20">Active</Badge>;
    case SubscriptionStatus.paused:
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Paused</Badge>;
    case SubscriptionStatus.cancelled:
      return <Badge variant="secondary" className="text-muted-foreground">Cancelled</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

interface AddSubForm {
  customerId: string;
  planName: string;
  menuItemIds: number[];
  frequencyDays: string;
  startDate: string;
}

const emptyForm: AddSubForm = {
  customerId: '',
  planName: '',
  menuItemIds: [],
  frequencyDays: '7',
  startDate: new Date().toISOString().split('T')[0],
};

export default function SubscriptionsPage() {
  const { data: subscriptions, isLoading, error } = useSubscriptions();
  const { data: customers } = useCustomers();
  const { data: menuItems } = useMenuItems();
  const createSubscription = useCreateSubscription();
  const pauseSubscription = usePauseSubscription();
  const resumeSubscription = useResumeSubscription();
  const cancelSubscription = useCancelSubscription();

  const [addOpen, setAddOpen] = useState(false);
  const [formData, setFormData] = useState<AddSubForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof AddSubForm, string>>>({});
  const [search, setSearch] = useState('');
  const [pendingAction, setPendingAction] = useState<number | null>(null);

  const availableMenuItems = useMemo(
    () => (menuItems ?? []).filter((m) => m.isAvailable),
    [menuItems]
  );

  const autoPrice = useMemo(() => {
    return formData.menuItemIds.reduce((sum, id) => {
      const item = (menuItems ?? []).find((m) => m.id === id);
      return sum + (item?.sellingPrice ?? 0);
    }, 0);
  }, [formData.menuItemIds, menuItems]);

  const customerMap = useMemo(() => {
    const map = new Map<string, string>();
    (customers ?? []).forEach((c) => map.set(c.id.toString(), c.name));
    return map;
  }, [customers]);

  const menuItemMap = useMemo(() => {
    const map = new Map<string, string>();
    (menuItems ?? []).forEach((m) => map.set(m.id.toString(), m.name));
    return map;
  }, [menuItems]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return (subscriptions ?? []).filter((s) => {
      const customerName = customerMap.get(s.customerId.toString()) ?? '';
      return (
        s.planName.toLowerCase().includes(q) ||
        customerName.toLowerCase().includes(q)
      );
    });
  }, [subscriptions, search, customerMap]);

  const validate = (): boolean => {
    const errors: Partial<Record<keyof AddSubForm, string>> = {};
    if (!formData.customerId) errors.customerId = 'Customer is required';
    if (!formData.planName.trim()) errors.planName = 'Plan name is required';
    if (formData.menuItemIds.length === 0) errors.menuItemIds = 'Select at least one menu item';
    const freq = parseInt(formData.frequencyDays);
    if (isNaN(freq) || freq < 1) errors.frequencyDays = 'Frequency must be at least 1 day';
    if (!formData.startDate) errors.startDate = 'Start date is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAdd = async () => {
    if (!validate()) return;
    await createSubscription.mutateAsync({
      customerId: parseInt(formData.customerId),
      planName: formData.planName,
      menuItemIds: formData.menuItemIds,
      frequencyDays: parseInt(formData.frequencyDays),
      startDate: new Date(formData.startDate).getTime(),
      totalPrice: autoPrice,
    });
    setAddOpen(false);
    setFormData(emptyForm);
    setFormErrors({});
  };

  const handleToggleMenuItem = (id: number) => {
    setFormData((prev) => {
      const exists = prev.menuItemIds.some((x) => x === id);
      return {
        ...prev,
        menuItemIds: exists
          ? prev.menuItemIds.filter((x) => x !== id)
          : [...prev.menuItemIds, id],
      };
    });
    if (formErrors.menuItemIds) setFormErrors((prev) => ({ ...prev, menuItemIds: undefined }));
  };

  const handlePause = async (id: number) => {
    setPendingAction(id);
    try { await pauseSubscription.mutateAsync(id); } finally { setPendingAction(null); }
  };

  const handleResume = async (id: number) => {
    setPendingAction(id);
    try { await resumeSubscription.mutateAsync(id); } finally { setPendingAction(null); }
  };

  const handleCancel = async (id: number) => {
    setPendingAction(id);
    try { await cancelSubscription.mutateAsync(id); } finally { setPendingAction(null); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Subscriptions</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage recurring delivery plans for customers</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Subscription
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search subscriptions..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
              <CalendarClock className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-heading font-semibold">All Subscriptions</CardTitle>
              <CardDescription className="text-xs">Active, paused, and cancelled plans</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : error ? (
            <div className="p-8 text-center text-destructive text-sm">Failed to load subscriptions.</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <CalendarClock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium text-foreground text-sm">
                {search ? 'No subscriptions match your search' : 'No subscriptions yet'}
              </p>
              <p className="text-muted-foreground text-xs mt-1">
                {search ? 'Try a different search term.' : 'Add your first subscription above.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
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
                  {filtered.map((sub: Subscription) => {
                    const customerName = customerMap.get(sub.customerId.toString()) ?? 'Unknown';
                    const isPending = pendingAction === sub.id;
                    return (
                      <TableRow key={sub.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">{customerName}</TableCell>
                        <TableCell>{sub.planName}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {sub.menuItemIds.map(id => menuItemMap.get(id.toString()) ?? `#${id}`).join(', ')}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          Every {sub.frequencyDays}d
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(sub.nextRenewalDate)}
                        </TableCell>
                        <TableCell className="font-semibold text-primary">
                          ${sub.totalPrice.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={sub.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {sub.status === SubscriptionStatus.active && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={isPending}
                                onClick={() => handlePause(sub.id)}
                                title="Pause"
                              >
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pause className="h-4 w-4" />}
                              </Button>
                            )}
                            {sub.status === SubscriptionStatus.paused && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={isPending}
                                onClick={() => handleResume(sub.id)}
                                title="Resume"
                              >
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                              </Button>
                            )}
                            {sub.status !== SubscriptionStatus.cancelled && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                disabled={isPending}
                                onClick={() => handleCancel(sub.id)}
                                title="Cancel"
                              >
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Subscription Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Subscription</DialogTitle>
            <DialogDescription>Create a new recurring delivery plan for a customer.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Customer */}
            <div className="space-y-1.5">
              <Label>Customer <span className="text-destructive">*</span></Label>
              <Select
                value={formData.customerId}
                onValueChange={v => {
                  setFormData(p => ({ ...p, customerId: v }));
                  if (formErrors.customerId) setFormErrors(p => ({ ...p, customerId: undefined }));
                }}
              >
                <SelectTrigger className={cn(formErrors.customerId && 'border-destructive')}>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {(customers ?? []).map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.customerId && <p className="text-xs text-destructive">{formErrors.customerId}</p>}
            </div>

            {/* Plan Name */}
            <div className="space-y-1.5">
              <Label htmlFor="planName">Plan Name <span className="text-destructive">*</span></Label>
              <Input
                id="planName"
                placeholder="e.g. Weekly Salad Box"
                value={formData.planName}
                onChange={e => {
                  setFormData(p => ({ ...p, planName: e.target.value }));
                  if (formErrors.planName) setFormErrors(p => ({ ...p, planName: undefined }));
                }}
                className={cn(formErrors.planName && 'border-destructive')}
              />
              {formErrors.planName && <p className="text-xs text-destructive">{formErrors.planName}</p>}
            </div>

            {/* Menu Items */}
            <div className="space-y-1.5">
              <Label>Menu Items <span className="text-destructive">*</span></Label>
              <div className={cn(
                'border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto',
                formErrors.menuItemIds && 'border-destructive'
              )}>
                {availableMenuItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No available menu items.</p>
                ) : (
                  availableMenuItems.map(item => (
                    <div key={item.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`sub-item-${item.id}`}
                        checked={formData.menuItemIds.includes(item.id)}
                        onCheckedChange={() => handleToggleMenuItem(item.id)}
                      />
                      <label htmlFor={`sub-item-${item.id}`} className="text-sm flex-1 cursor-pointer">
                        {item.name}
                      </label>
                      <span className="text-xs text-muted-foreground">${item.sellingPrice.toFixed(2)}</span>
                    </div>
                  ))
                )}
              </div>
              {formErrors.menuItemIds && <p className="text-xs text-destructive">{formErrors.menuItemIds}</p>}
              {formData.menuItemIds.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Total: <span className="font-semibold text-primary">${autoPrice.toFixed(2)}</span>
                </p>
              )}
            </div>

            {/* Frequency */}
            <div className="space-y-1.5">
              <Label htmlFor="frequencyDays">Delivery Frequency (days) <span className="text-destructive">*</span></Label>
              <Input
                id="frequencyDays"
                type="number"
                min="1"
                value={formData.frequencyDays}
                onChange={e => {
                  setFormData(p => ({ ...p, frequencyDays: e.target.value }));
                  if (formErrors.frequencyDays) setFormErrors(p => ({ ...p, frequencyDays: undefined }));
                }}
                className={cn(formErrors.frequencyDays && 'border-destructive')}
              />
              {formErrors.frequencyDays && <p className="text-xs text-destructive">{formErrors.frequencyDays}</p>}
            </div>

            {/* Start Date */}
            <div className="space-y-1.5">
              <Label htmlFor="startDate">Start Date <span className="text-destructive">*</span></Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={e => {
                  setFormData(p => ({ ...p, startDate: e.target.value }));
                  if (formErrors.startDate) setFormErrors(p => ({ ...p, startDate: undefined }));
                }}
                className={cn(formErrors.startDate && 'border-destructive')}
              />
              {formErrors.startDate && <p className="text-xs text-destructive">{formErrors.startDate}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddOpen(false); setFormData(emptyForm); setFormErrors({}); }}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={createSubscription.isPending}>
              {createSubscription.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Add Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
