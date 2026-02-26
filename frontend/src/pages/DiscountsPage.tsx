import React, { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useDiscountCodes,
  useCreateDiscountCode,
  useUpdateDiscountCode,
  useToggleDiscountCode,
  useDeleteDiscountCode,
  DiscountType,
} from '../hooks/useQueries';
import type { DiscountCode, DiscountCodeInput } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Tag, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString();
}

function formatCurrency(v: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
}

interface DCForm {
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minimumOrderAmount: number;
  maxUses: string;
  expiresAt: string;
}

const emptyForm: DCForm = {
  code: '',
  description: '',
  discountType: DiscountType.percentage,
  discountValue: 0,
  minimumOrderAmount: 0,
  maxUses: '',
  expiresAt: '',
};

export default function DiscountsPage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();

  useEffect(() => {
    if (!identity) navigate({ to: '/dashboard' });
  }, [identity, navigate]);

  const { data: discountCodes = [], isLoading } = useDiscountCodes();
  const createDC = useCreateDiscountCode();
  const updateDC = useUpdateDiscountCode();
  const toggleDC = useToggleDiscountCode();
  const deleteDC = useDeleteDiscountCode();

  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<DiscountCode | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DiscountCode | null>(null);
  const [form, setForm] = useState<DCForm>(emptyForm);

  const openAdd = () => {
    setForm(emptyForm);
    setShowAdd(true);
  };

  const openEdit = (dc: DiscountCode) => {
    setEditTarget(dc);
    setForm({
      code: dc.code,
      description: dc.description,
      discountType: dc.discountType === 'percentage' ? DiscountType.percentage : DiscountType.fixed,
      discountValue: dc.discountValue,
      minimumOrderAmount: dc.minimumOrderAmount,
      maxUses: dc.maxUses != null ? dc.maxUses.toString() : '',
      expiresAt: dc.expiresAt != null
        ? new Date(Number(dc.expiresAt) / 1_000_000).toISOString().split('T')[0]
        : '',
    });
  };

  const buildInput = (): DiscountCodeInput => ({
    code: form.code.trim().toUpperCase(),
    description: form.description.trim(),
    discountType: form.discountType,
    discountValue: form.discountValue,
    minimumOrderAmount: form.minimumOrderAmount,
    maxUses: form.maxUses ? parseInt(form.maxUses) : undefined,
    expiresAt: form.expiresAt ? new Date(form.expiresAt).getTime() : undefined,
  });

  const handleSave = async () => {
    if (!form.code.trim()) return;
    try {
      if (editTarget) {
        await updateDC.mutateAsync({ id: editTarget.id, input: buildInput() });
        setEditTarget(null);
      } else {
        await createDC.mutateAsync(buildInput());
        setShowAdd(false);
      }
      setForm(emptyForm);
    } catch {
      // handled by mutation
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteDC.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const isSaving = createDC.isPending || updateDC.isPending;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Discount Codes</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage promotional discount codes</p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Code
        </Button>
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
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Min Order</TableHead>
                <TableHead>Uses</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {discountCodes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                    No discount codes yet.
                  </TableCell>
                </TableRow>
              ) : (
                discountCodes.map(dc => (
                  <TableRow key={dc.id.toString()}>
                    <TableCell className="font-mono font-medium">{dc.code}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">{dc.discountType}</Badge>
                    </TableCell>
                    <TableCell>
                      {dc.discountType === DiscountType.percentage
                        ? `${dc.discountValue}%`
                        : formatCurrency(dc.discountValue)}
                    </TableCell>
                    <TableCell>{formatCurrency(dc.minimumOrderAmount)}</TableCell>
                    <TableCell>
                      {dc.usedCount.toString()}{dc.maxUses != null ? `/${dc.maxUses.toString()}` : ''}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {dc.expiresAt != null ? formatDate(Number(dc.expiresAt) / 1_000_000) : '—'}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={dc.isActive}
                        onCheckedChange={() => toggleDC.mutate(dc.id)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(dc)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(dc)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showAdd || !!editTarget} onOpenChange={open => { if (!open) { setShowAdd(false); setEditTarget(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Discount Code' : 'Add Discount Code'}</DialogTitle>
            <DialogDescription>Configure the discount code details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="dc-code">Code *</Label>
              <Input id="dc-code" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. SAVE10" className="font-mono" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dc-desc">Description</Label>
              <Textarea id="dc-desc" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Type</Label>
                <Select value={form.discountType} onValueChange={v => setForm(f => ({ ...f, discountType: v as DiscountType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={DiscountType.percentage}>Percentage</SelectItem>
                    <SelectItem value={DiscountType.fixed}>Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="dc-value">Value *</Label>
                <Input id="dc-value" type="number" min={0} step="0.01" value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: parseFloat(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="dc-min">Min Order Amount</Label>
                <Input id="dc-min" type="number" min={0} step="0.01" value={form.minimumOrderAmount} onChange={e => setForm(f => ({ ...f, minimumOrderAmount: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="dc-max">Max Uses</Label>
                <Input id="dc-max" type="number" min={1} value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))} placeholder="Unlimited" />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="dc-expires">Expires At</Label>
              <Input id="dc-expires" type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAdd(false); setEditTarget(null); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving || !form.code.trim()}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editTarget ? 'Save Changes' : 'Add Code'}
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
              Are you sure you want to delete <strong>{deleteTarget?.code}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleteDC.isPending}
            >
              {deleteDC.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
