import { useState, useMemo } from 'react';
import {
  useSubscriptions,
  useCustomers,
  useMenuItems,
  useCreateSubscription,
  usePauseSubscription,
  useResumeSubscription,
  useCancelSubscription,
} from '../hooks/useQueries';
import type { Subscription } from '../backend';
import { SubscriptionStatus } from '../backend';
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

function StatusBadge({ status }: { status: SubscriptionStatus }) {
  switch (status) {
    case SubscriptionStatus.active:
      return <Badge className="bg-primary/15 text-primary border-primary/30 hover:bg-primary/20">Active</Badge>;
    case SubscriptionStatus.paused:
      return <Badge className="bg-warning/15 text-warning border-warning/30 hover:bg-warning/20">Paused</Badge>;
    case SubscriptionStatus.cancelled:
      return <Badge variant="secondary" className="text-muted-foreground">Cancelled</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
}

function formatDate(ts: bigint) {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

interface AddSubForm {
  customerId: string;
  planName: string;
  menuItemIds: bigint[];
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
  const [pendingAction, setPendingAction] = useState<bigint | null>(null);

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
    const startDateMs = new Date(formData.startDate).getTime();
    const startDateNs = BigInt(startDateMs) * BigInt(1_000_000);
    await createSubscription.mutateAsync({
      customerId: BigInt(formData.customerId),
      planName: formData.planName,
      menuItemIds: formData.menuItemIds,
      frequencyDays: BigInt(parseInt(formData.frequencyDays)),
      startDate: startDateNs,
      startPrice: autoPrice,
    });
    setAddOpen(false);
    setFormData(emptyForm);
    setFormErrors({});
  };

  const handleToggleMenuItem = (id: bigint) => {
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

  const handlePause = async (id: bigint) => {
    setPendingAction(id);
    try { await pauseSubscription.mutateAsync(id); } finally { setPendingAction(null); }
  };

  const handleResume = async (id: bigint) => {
    setPendingAction(id);
    try { await resumeSubscription.mutateAsync(id); } finally { setPendingAction(null); }
  };

  const handleCancel = async (id: bigint) => {
    setPendingAction(id);
    try { await cancelSubscription.mutateAsync(id); } finally { setPendingAction(null); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarClock className="w-6 h-6 text-primary" />
            Subscriptions
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage recurring subscription plans for your customers
          </p>
        </div>
        <Button onClick={() => { setFormData(emptyForm); setFormErrors({}); setAddOpen(true); }} className="self-start sm:self-auto flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Subscription
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by plan or customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <Card className="border-border shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading font-semibold">All Subscriptions</CardTitle>
          <CardDescription className="text-xs">
            {isLoading ? 'Loading...' : `${filtered.length} subscription${filtered.length !== 1 ? 's' : ''} found`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div className="p-6 text-center text-destructive text-sm">
              Failed to load subscriptions. You may not have admin access.
            </div>
          ) : isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-3">
                <CalendarClock className="w-6 h-6 text-primary" />
              </div>
              <p className="font-medium text-foreground text-sm">No subscriptions yet</p>
              <p className="text-muted-foreground text-xs mt-1">
                {search ? 'No subscriptions match your search.' : 'Create your first subscription plan.'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="font-semibold text-foreground">Customer</TableHead>
                      <TableHead className="font-semibold text-foreground">Plan</TableHead>
                      <TableHead className="font-semibold text-foreground">Items</TableHead>
                      <TableHead className="font-semibold text-foreground">Frequency</TableHead>
                      <TableHead className="font-semibold text-foreground">Next Renewal</TableHead>
                      <TableHead className="font-semibold text-foreground">Price</TableHead>
                      <TableHead className="font-semibold text-foreground">Status</TableHead>
                      <TableHead className="font-semibold text-foreground text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((sub) => (
                      <SubscriptionRow
                        key={sub.id.toString()}
                        sub={sub}
                        customerName={customerMap.get(sub.customerId.toString()) ?? `#${sub.customerId}`}
                        menuItemNames={sub.menuItemIds.map((id) => menuItemMap.get(id.toString()) ?? `#${id}`)}
                        isPending={pendingAction === sub.id}
                        onPause={() => handlePause(sub.id)}
                        onResume={() => handleResume(sub.id)}
                        onCancel={() => handleCancel(sub.id)}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden divide-y divide-border">
                {filtered.map((sub) => (
                  <SubscriptionCard
                    key={sub.id.toString()}
                    sub={sub}
                    customerName={customerMap.get(sub.customerId.toString()) ?? `#${sub.customerId}`}
                    menuItemNames={sub.menuItemIds.map((id) => menuItemMap.get(id.toString()) ?? `#${id}`)}
                    isPending={pendingAction === sub.id}
                    onPause={() => handlePause(sub.id)}
                    onResume={() => handleResume(sub.id)}
                    onCancel={() => handleCancel(sub.id)}
                  />
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Subscription Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Add Subscription</DialogTitle>
            <DialogDescription>Create a new subscription plan for a customer.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Customer */}
            <div className="space-y-1.5">
              <Label>Customer <span className="text-destructive">*</span></Label>
              <Select
                value={formData.customerId}
                onValueChange={(v) => {
                  setFormData((p) => ({ ...p, customerId: v }));
                  if (formErrors.customerId) setFormErrors((p) => ({ ...p, customerId: undefined }));
                }}
              >
                <SelectTrigger className={cn(formErrors.customerId && 'border-destructive')}>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {(customers ?? []).map((c) => (
                    <SelectItem key={c.id.toString()} value={c.id.toString()}>
                      {c.name} — {c.email}
                    </SelectItem>
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
                value={formData.planName}
                onChange={(e) => {
                  setFormData((p) => ({ ...p, planName: e.target.value }));
                  if (formErrors.planName) setFormErrors((p) => ({ ...p, planName: undefined }));
                }}
                placeholder="e.g. Weekly Salad Box"
                className={cn(formErrors.planName && 'border-destructive')}
              />
              {formErrors.planName && <p className="text-xs text-destructive">{formErrors.planName}</p>}
            </div>

            {/* Menu Items */}
            <div className="space-y-1.5">
              <Label>Menu Items <span className="text-destructive">*</span></Label>
              <div className={cn(
                'border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto',
                formErrors.menuItemIds ? 'border-destructive' : 'border-border'
              )}>
                {availableMenuItems.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No available menu items.</p>
                ) : (
                  availableMenuItems.map((item) => (
                    <div key={item.id.toString()} className="flex items-center gap-2">
                      <Checkbox
                        id={`item-${item.id}`}
                        checked={formData.menuItemIds.some((x) => x === item.id)}
                        onCheckedChange={() => handleToggleMenuItem(item.id)}
                      />
                      <label
                        htmlFor={`item-${item.id}`}
                        className="flex-1 flex items-center justify-between text-sm cursor-pointer"
                      >
                        <span>{item.name}</span>
                        <span className="text-muted-foreground text-xs">${item.sellingPrice.toFixed(2)}</span>
                      </label>
                    </div>
                  ))
                )}
              </div>
              {formErrors.menuItemIds && <p className="text-xs text-destructive">{formErrors.menuItemIds}</p>}
            </div>

            {/* Frequency */}
            <div className="space-y-1.5">
              <Label htmlFor="frequency">Frequency (days) <span className="text-destructive">*</span></Label>
              <Input
                id="frequency"
                type="number"
                min={1}
                value={formData.frequencyDays}
                onChange={(e) => {
                  setFormData((p) => ({ ...p, frequencyDays: e.target.value }));
                  if (formErrors.frequencyDays) setFormErrors((p) => ({ ...p, frequencyDays: undefined }));
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
                onChange={(e) => {
                  setFormData((p) => ({ ...p, startDate: e.target.value }));
                  if (formErrors.startDate) setFormErrors((p) => ({ ...p, startDate: undefined }));
                }}
                className={cn(formErrors.startDate && 'border-destructive')}
              />
              {formErrors.startDate && <p className="text-xs text-destructive">{formErrors.startDate}</p>}
            </div>

            {/* Total Price (auto-calculated) */}
            <div className="space-y-1.5">
              <Label>Total Price (auto-calculated)</Label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary border border-border">
                <span className="text-sm font-semibold text-foreground">${autoPrice.toFixed(2)}</span>
                <span className="text-xs text-muted-foreground">per cycle</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={createSubscription.isPending}>
              {createSubscription.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface RowProps {
  sub: Subscription;
  customerName: string;
  menuItemNames: string[];
  isPending: boolean;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
}

function SubscriptionRow({ sub, customerName, menuItemNames, isPending, onPause, onResume, onCancel }: RowProps) {
  return (
    <TableRow className="border-border hover:bg-accent/50">
      <TableCell className="font-medium text-foreground">{customerName}</TableCell>
      <TableCell className="text-foreground">{sub.planName}</TableCell>
      <TableCell className="text-muted-foreground text-sm max-w-[160px] truncate" title={menuItemNames.join(', ')}>
        {menuItemNames.join(', ') || '—'}
      </TableCell>
      <TableCell className="text-muted-foreground">{Number(sub.frequencyDays)}d</TableCell>
      <TableCell className="text-muted-foreground text-sm">{formatDate(sub.nextRenewalDate)}</TableCell>
      <TableCell className="font-semibold text-foreground">${sub.totalPrice.toFixed(2)}</TableCell>
      <TableCell><StatusBadge status={sub.status} /></TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : (
            <>
              {sub.status === SubscriptionStatus.active && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-muted-foreground hover:text-warning"
                  onClick={onPause}
                  title="Pause"
                >
                  <Pause className="w-4 h-4" />
                </Button>
              )}
              {sub.status === SubscriptionStatus.paused && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-muted-foreground hover:text-primary"
                  onClick={onResume}
                  title="Resume"
                >
                  <Play className="w-4 h-4" />
                </Button>
              )}
              {sub.status !== SubscriptionStatus.cancelled && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-muted-foreground hover:text-destructive"
                  onClick={onCancel}
                  title="Cancel"
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              )}
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

function SubscriptionCard({ sub, customerName, menuItemNames, isPending, onPause, onResume, onCancel }: RowProps) {
  return (
    <div className="p-4 hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="font-semibold text-foreground text-sm">{sub.planName}</p>
            <StatusBadge status={sub.status} />
          </div>
          <p className="text-sm text-muted-foreground">{customerName}</p>
          <p className="text-xs text-muted-foreground mt-1 truncate">{menuItemNames.join(', ') || '—'}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Every {Number(sub.frequencyDays)}d · Next: {formatDate(sub.nextRenewalDate)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <p className="font-bold text-foreground text-sm">${sub.totalPrice.toFixed(2)}</p>
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : (
            <div className="flex items-center gap-1">
              {sub.status === SubscriptionStatus.active && (
                <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-warning" onClick={onPause}>
                  <Pause className="w-3.5 h-3.5" />
                </Button>
              )}
              {sub.status === SubscriptionStatus.paused && (
                <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-primary" onClick={onResume}>
                  <Play className="w-3.5 h-3.5" />
                </Button>
              )}
              {sub.status !== SubscriptionStatus.cancelled && (
                <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-destructive" onClick={onCancel}>
                  <XCircle className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
