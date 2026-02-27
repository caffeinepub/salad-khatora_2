import React, { useState } from 'react';
import { useActor } from '../hooks/useActor';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Edit, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

function getAppliesToLabel(appliesTo: string): string {
  if (appliesTo === TaxAppliesTo.all) return 'All';
  if (appliesTo === TaxAppliesTo.menuItems) return 'Menu Items';
  if (appliesTo === TaxAppliesTo.combos) return 'Combos';
  return appliesTo;
}

interface TaxForm {
  name: string;
  rate: string;
  appliesTo: TaxAppliesTo;
}

const emptyForm: TaxForm = {
  name: '',
  rate: '',
  appliesTo: TaxAppliesTo.all,
};

function extractErrorMessage(err: unknown): string {
  if (!err) return 'An unknown error occurred';
  const msg = err instanceof Error ? err.message : String(err);
  const match = msg.match(/Reject text: (.+)$/s) || msg.match(/Error: (.+)$/s);
  if (match) return match[1].trim();
  return msg;
}

export default function TaxConfigPage() {
  const { isFetching: actorFetching } = useActor();

  const { data: taxConfigs = [], isLoading } = useTaxConfigs();
  const createTC = useCreateTaxConfig();
  const updateTC = useUpdateTaxConfig();
  const toggleTC = useToggleTaxConfig();
  const deleteTC = useDeleteTaxConfig();

  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<TaxConfig | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TaxConfig | null>(null);
  const [form, setForm] = useState<TaxForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const openAdd = () => {
    setForm(emptyForm);
    setFormError(null);
    createTC.reset();
    setShowAdd(true);
  };

  const openEdit = (tc: TaxConfig) => {
    setEditTarget(tc);
    setFormError(null);
    updateTC.reset();
    let appliesTo = TaxAppliesTo.all;
    if ((tc.appliesTo as string) === TaxAppliesTo.menuItems) appliesTo = TaxAppliesTo.menuItems;
    else if ((tc.appliesTo as string) === TaxAppliesTo.combos) appliesTo = TaxAppliesTo.combos;
    setForm({ name: tc.name, rate: String(tc.rate), appliesTo });
  };

  const closeDialog = () => {
    setShowAdd(false);
    setEditTarget(null);
    setFormError(null);
  };

  const buildInput = (): TaxConfigInput => ({
    name: form.name.trim(),
    rate: parseFloat(form.rate) || 0,
    appliesTo: form.appliesTo as TaxAppliesTo,
  });

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFormError('Name is required.');
      return;
    }
    const rateVal = parseFloat(form.rate);
    if (isNaN(rateVal) || rateVal < 0 || rateVal > 100) {
      setFormError('Rate must be a number between 0 and 100.');
      return;
    }
    if (actorFetching) {
      setFormError('Still connecting to the backend. Please wait a moment and try again.');
      return;
    }
    setFormError(null);
    try {
      if (editTarget) {
        await updateTC.mutateAsync({ id: editTarget.id, input: buildInput() });
        setEditTarget(null);
      } else {
        await createTC.mutateAsync(buildInput());
        setShowAdd(false);
      }
      setForm(emptyForm);
    } catch (err) {
      setFormError(extractErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTC.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // error shown via mutation state
    }
  };

  const isSaving = createTC.isPending || updateTC.isPending;
  const isSubmitDisabled = isSaving || actorFetching || !form.name.trim();

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
                        disabled={actorFetching}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(tc)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(tc)}
                        >
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
      <Dialog open={showAdd || !!editTarget} onOpenChange={open => { if (!open) closeDialog(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Tax Config' : 'Add Tax Config'}</DialogTitle>
            <DialogDescription>Configure the tax rate details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {actorFetching && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>Connecting to backend, please wait…</AlertDescription>
              </Alert>
            )}
            {formError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-1">
              <Label htmlFor="tc-name">Name *</Label>
              <Input
                id="tc-name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. VAT"
              />
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
                onChange={e => setForm(f => ({ ...f, rate: e.target.value }))}
                placeholder="e.g. 5"
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
            <Button variant="outline" onClick={closeDialog} disabled={isSaving}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSubmitDisabled}>
              {(isSaving || actorFetching) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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
              disabled={deleteTC.isPending || actorFetching}
            >
              {(deleteTC.isPending || actorFetching) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
