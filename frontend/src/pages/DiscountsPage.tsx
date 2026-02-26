import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useDiscountCodes,
  useCreateDiscountCode,
  useUpdateDiscountCode,
  useDeleteDiscountCode,
  useToggleDiscountCodeActive,
  DiscountCode,
  DiscountCodeInput,
  DiscountType,
} from '../hooks/useQueries';
import {
  Tag, Plus, Pencil, Trash2, Loader2, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

function formatCurrency(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
}

function formatDate(ts: number) {
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(ts));
}

interface FormState {
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: string;
  minimumOrderAmount: string;
  maxUses: string;
  expiresAt: string;
  isActive: boolean;
}

const defaultForm: FormState = {
  code: '',
  description: '',
  discountType: 'percentage',
  discountValue: '',
  minimumOrderAmount: '0',
  maxUses: '',
  expiresAt: '',
  isActive: true,
};

function discountToForm(dc: DiscountCode): FormState {
  return {
    code: dc.code,
    description: dc.description,
    discountType: dc.discountType === DiscountType.percentage ? 'percentage' : 'fixed',
    discountValue: dc.discountValue.toString(),
    minimumOrderAmount: dc.minimumOrderAmount.toString(),
    maxUses: dc.maxUses !== undefined && dc.maxUses !== null ? dc.maxUses.toString() : '',
    expiresAt: dc.expiresAt !== undefined && dc.expiresAt !== null
      ? new Date(dc.expiresAt).toISOString().split('T')[0]
      : '',
    isActive: dc.isActive,
  };
}

export default function DiscountsPage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();

  useEffect(() => {
    if (!identity) navigate({ to: '/login' });
  }, [identity, navigate]);

  const { data: discountCodes, isLoading } = useDiscountCodes();
  const createMutation = useCreateDiscountCode();
  const updateMutation = useUpdateDiscountCode();
  const deleteMutation = useDeleteDiscountCode();
  const toggleMutation = useToggleDiscountCodeActive();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DiscountCode | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [formError, setFormError] = useState('');

  const openAdd = () => {
    setEditingCode(null);
    setForm(defaultForm);
    setFormError('');
    setDialogOpen(true);
  };

  const openEdit = (dc: DiscountCode) => {
    setEditingCode(dc);
    setForm(discountToForm(dc));
    setFormError('');
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    setFormError('');
    if (!form.code.trim()) { setFormError('Code is required.'); return; }
    const val = parseFloat(form.discountValue);
    if (isNaN(val) || val <= 0) { setFormError('Discount value must be greater than 0.'); return; }

    const input: DiscountCodeInput = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim(),
      discountType: form.discountType === 'percentage' ? DiscountType.percentage : DiscountType.fixed,
      discountValue: val,
      minimumOrderAmount: parseFloat(form.minimumOrderAmount) || 0,
      maxUses: form.maxUses ? parseInt(form.maxUses) : undefined,
      expiresAt: form.expiresAt
        ? new Date(form.expiresAt).getTime()
        : undefined,
    };

    try {
      if (editingCode) {
        await updateMutation.mutateAsync({ id: editingCode.id, input });
        toast.success('Discount code updated successfully');
      } else {
        await createMutation.mutateAsync(input);
        toast.success('Discount code created successfully');
      }
      setDialogOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success('Discount code deleted');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const handleToggle = async (dc: DiscountCode) => {
    try {
      await toggleMutation.mutateAsync(dc.id);
      toast.success(`Code ${dc.isActive ? 'deactivated' : 'activated'}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to toggle');
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Discounts & Coupons</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage promo codes and discount rules</p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Discount Code
        </Button>
      </div>

      <Card className="border-border shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
              <Tag className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-heading font-semibold">Discount Codes</CardTitle>
              <CardDescription className="text-xs">All active and inactive promo codes</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
            </div>
          ) : !discountCodes || discountCodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Tag className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="font-medium text-foreground text-sm">No discount codes yet</p>
              <p className="text-muted-foreground text-xs mt-1">Create your first promo code above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {['Code', 'Description', 'Type', 'Value', 'Min Order', 'Max Uses', 'Used', 'Expires', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {discountCodes.map(dc => (
                    <tr key={dc.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-primary">{dc.code}</td>
                      <td className="py-3 px-3 text-muted-foreground max-w-[150px] truncate">{dc.description || '—'}</td>
                      <td className="py-3 px-3">
                        <Badge variant="outline" className="text-xs capitalize">{dc.discountType}</Badge>
                      </td>
                      <td className="py-3 px-3 font-semibold">
                        {dc.discountType === DiscountType.percentage
                          ? `${dc.discountValue}%`
                          : formatCurrency(dc.discountValue)}
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">{formatCurrency(dc.minimumOrderAmount)}</td>
                      <td className="py-3 px-3 text-muted-foreground">{dc.maxUses ?? '∞'}</td>
                      <td className="py-3 px-3 text-muted-foreground">{dc.usedCount}</td>
                      <td className="py-3 px-3 text-muted-foreground">
                        {dc.expiresAt ? formatDate(dc.expiresAt) : '—'}
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={dc.isActive ? 'default' : 'secondary'}
                          className={dc.isActive ? 'bg-primary/10 text-primary border-primary/20' : ''}
                        >
                          {dc.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleToggle(dc)}
                            disabled={toggleMutation.isPending}
                            className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                            title={dc.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {dc.isActive
                              ? <ToggleRight className="w-4 h-4 text-primary" />
                              : <ToggleLeft className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => openEdit(dc)}
                            className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(dc)}
                            className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCode ? 'Edit Discount Code' : 'Add Discount Code'}</DialogTitle>
            <DialogDescription>
              {editingCode ? 'Update the discount code details.' : 'Create a new promo code for customers.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="dc-code">Code <span className="text-destructive">*</span></Label>
              <Input
                id="dc-code"
                placeholder="e.g. SAVE10"
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                className="font-mono uppercase"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dc-description">Description</Label>
              <Textarea
                id="dc-description"
                placeholder="Optional description..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Discount Type</Label>
                <Select
                  value={form.discountType}
                  onValueChange={v => setForm(f => ({ ...f, discountType: v as 'percentage' | 'fixed' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dc-value">Value <span className="text-destructive">*</span></Label>
                <Input
                  id="dc-value"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder={form.discountType === 'percentage' ? 'e.g. 10' : 'e.g. 5.00'}
                  value={form.discountValue}
                  onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="dc-min">Min Order ($)</Label>
                <Input
                  id="dc-min"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.minimumOrderAmount}
                  onChange={e => setForm(f => ({ ...f, minimumOrderAmount: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dc-maxuses">Max Uses</Label>
                <Input
                  id="dc-maxuses"
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  value={form.maxUses}
                  onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dc-expires">Expires At</Label>
              <Input
                id="dc-expires"
                type="date"
                value={form.expiresAt}
                onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
              />
            </div>
            {formError && (
              <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{formError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : editingCode ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Discount Code</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.code}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
