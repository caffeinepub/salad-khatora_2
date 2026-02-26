import React, { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useTaxConfigs,
  useCreateTaxConfig,
  useUpdateTaxConfig,
  useToggleTaxConfig,
  useDeleteTaxConfig,
  TaxAppliesTo,
} from '../hooks/useQueries';
import type { TaxConfig, TaxConfigInput } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

function getAppliesToLabel(appliesTo: string): string {
  if (appliesTo === TaxAppliesTo.all) return 'All';
  if (appliesTo === TaxAppliesTo.menuItems) return 'Menu Items';
  if (appliesTo === TaxAppliesTo.combos) return 'Combos';
  return appliesTo;
}

interface TaxForm {
  name: string;
  rate: number;
  appliesTo: TaxAppliesTo;
}

const emptyForm: TaxForm = {
  name: '',
  rate: 0,
  appliesTo: TaxAppliesTo.all,
};

export default function TaxConfigPage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to dashboard if not authenticated (no /login route exists)
    if (!identity) navigate({ to: '/dashboard' });
  }, [identity, navigate]);

  const { data: taxConfigs = [], isLoading } = useTaxConfigs();
  const createTC = useCreateTaxConfig();
  const updateTC = useUpdateTaxConfig();
  const toggleTC = useToggleTaxConfig();
  const deleteTC = useDeleteTaxConfig();

  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<TaxConfig | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TaxConfig | null>(null);
  const [form, setForm] = useState<TaxForm>(emptyForm);

  const openAdd = () => {
    setForm(emptyForm);
    setShowAdd(true);
  };

  const openEdit = (tc: TaxConfig) => {
    setEditTarget(tc);
    let appliesTo = TaxAppliesTo.all;
    if (tc.appliesTo === TaxAppliesTo.menuItems) appliesTo = TaxAppliesTo.menuItems;
    else if (tc.appliesTo === TaxAppliesTo.combos) appliesTo = TaxAppliesTo.combos;
    setForm({ name: tc.name, rate: tc.rate, appliesTo });
  };

  const buildInput = (): TaxConfigInput => ({
    name: form.name.trim(),
    rate: form.rate,
    appliesTo: form.appliesTo,
  });

  const handleSave = async () => {
    if (!form.name.trim()) return;
    try {
      if (editTarget) {
        await updateTC.mutateAsync({ id: editTarget.id, input: buildInput() });
        setEditTarget(null);
      } else {
        await createTC.mutateAsync(buildInput());
        setShowAdd(false);
      }
      setForm(emptyForm);
    } catch {
      // handled by mutation
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteTC.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const isSaving = createTC.isPending || updateTC.isPending;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tax Configuration</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage tax rates applied to orders</p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Tax
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
                <TableHead>Name</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Applies To</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taxConfigs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                    No tax configurations yet.
                  </TableCell>
                </TableRow>
              ) : (
                taxConfigs.map(tc => (
                  <TableRow key={tc.id.toString()}>
                    <TableCell className="font-medium">{tc.name}</TableCell>
                    <TableCell>{tc.rate}%</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{getAppliesToLabel(tc.appliesTo as string)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={tc.isActive}
                        onCheckedChange={() => toggleTC.mutate(tc.id)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(tc)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(tc)}>
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
            <DialogTitle>{editTarget ? 'Edit Tax Config' : 'Add Tax Config'}</DialogTitle>
            <DialogDescription>Configure the tax rate details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="tc-name">Name *</Label>
              <Input id="tc-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. VAT" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tc-rate">Rate (%) *</Label>
              <Input
                id="tc-rate"
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={form.rate}
                onChange={e => setForm(f => ({ ...f, rate: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Applies To</Label>
              <Select value={form.appliesTo} onValueChange={v => setForm(f => ({ ...f, appliesTo: v as TaxAppliesTo }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={TaxAppliesTo.all}>All Items</SelectItem>
                  <SelectItem value={TaxAppliesTo.menuItems}>Menu Items Only</SelectItem>
                  <SelectItem value={TaxAppliesTo.combos}>Combos Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAdd(false); setEditTarget(null); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving || !form.name.trim()}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editTarget ? 'Save Changes' : 'Add Tax'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tax Config</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleteTC.isPending}
            >
              {deleteTC.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
