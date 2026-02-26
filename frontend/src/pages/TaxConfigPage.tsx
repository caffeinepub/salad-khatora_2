import { useState } from 'react';
import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useTaxConfigs,
  useCreateTaxConfig,
  useUpdateTaxConfig,
  useDeleteTaxConfig,
  useToggleTaxConfigActive,
  useCalculateTax,
  TaxConfig,
  TaxConfigInput,
  TaxAppliesTo,
} from '../hooks/useQueries';
import {
  Percent, Plus, Pencil, Trash2, Loader2, ToggleLeft, ToggleRight, Calculator,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

function formatCurrency(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
}

function appliesToLabel(a: TaxAppliesTo): string {
  switch (a) {
    case TaxAppliesTo.all: return 'All';
    case TaxAppliesTo.menuItems: return 'Menu Items';
    case TaxAppliesTo.combos: return 'Combos';
    default: return 'All';
  }
}

interface FormState {
  name: string;
  rate: string;
  appliesTo: 'all' | 'menuItems' | 'combos';
}

const defaultForm: FormState = { name: '', rate: '', appliesTo: 'all' };

function taxToForm(tc: TaxConfig): FormState {
  let appliesTo: 'all' | 'menuItems' | 'combos' = 'all';
  if (tc.appliesTo === TaxAppliesTo.menuItems) appliesTo = 'menuItems';
  else if (tc.appliesTo === TaxAppliesTo.combos) appliesTo = 'combos';
  return { name: tc.name, rate: tc.rate.toString(), appliesTo };
}

function LiveTaxPreview() {
  const [subtotalInput, setSubtotalInput] = useState('100');
  const subtotal = parseFloat(subtotalInput) || 0;
  const { data: taxResult, isLoading } = useCalculateTax(subtotal);

  return (
    <Card className="border-border shadow-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
            <Calculator className="w-4 h-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base font-heading font-semibold">Live Tax Preview</CardTitle>
            <CardDescription className="text-xs">Enter a sample subtotal to see tax breakdown</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="preview-subtotal">Sample Subtotal ($)</Label>
          <Input
            id="preview-subtotal"
            type="number"
            min="0"
            step="0.01"
            value={subtotalInput}
            onChange={e => setSubtotalInput(e.target.value)}
            className="max-w-xs"
          />
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map(i => <Skeleton key={i} className="h-8 rounded-lg" />)}
          </div>
        ) : taxResult ? (
          <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {taxResult.breakdown.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No active tax configs</p>
            ) : (
              taxResult.breakdown.map((tax, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-foreground">{tax.name} ({tax.rate}%)</span>
                  <span className="text-foreground">{formatCurrency(tax.amount)}</span>
                </div>
              ))
            )}
            <Separator className="my-1" />
            <div className="flex justify-between font-bold text-sm">
              <span>Total Tax</span>
              <span className="text-primary">{formatCurrency(taxResult.totalTaxAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-1 border-t border-border/50">
              <span>Grand Total</span>
              <span className="text-primary">{formatCurrency(subtotal + taxResult.totalTaxAmount)}</span>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function TaxConfigPage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();

  useEffect(() => {
    if (!identity) navigate({ to: '/login' });
  }, [identity, navigate]);

  const { data: taxConfigs, isLoading } = useTaxConfigs();
  const createMutation = useCreateTaxConfig();
  const updateMutation = useUpdateTaxConfig();
  const deleteMutation = useDeleteTaxConfig();
  const toggleMutation = useToggleTaxConfigActive();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<TaxConfig | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TaxConfig | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [formError, setFormError] = useState('');

  const openAdd = () => {
    setEditingConfig(null);
    setForm(defaultForm);
    setFormError('');
    setDialogOpen(true);
  };

  const openEdit = (tc: TaxConfig) => {
    setEditingConfig(tc);
    setForm(taxToForm(tc));
    setFormError('');
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    setFormError('');
    if (!form.name.trim()) { setFormError('Name is required.'); return; }
    const rate = parseFloat(form.rate);
    if (isNaN(rate) || rate <= 0) { setFormError('Rate must be greater than 0.'); return; }

    let appliesTo: TaxAppliesTo = TaxAppliesTo.all;
    if (form.appliesTo === 'menuItems') appliesTo = TaxAppliesTo.menuItems;
    else if (form.appliesTo === 'combos') appliesTo = TaxAppliesTo.combos;

    const input: TaxConfigInput = { name: form.name.trim(), rate, appliesTo };

    try {
      if (editingConfig) {
        await updateMutation.mutateAsync({ id: editingConfig.id, input });
        toast.success('Tax config updated');
      } else {
        await createMutation.mutateAsync(input);
        toast.success('Tax config created');
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
      toast.success('Tax config deleted');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const handleToggle = async (tc: TaxConfig) => {
    try {
      await toggleMutation.mutateAsync(tc.id);
      toast.success(`Tax config ${tc.isActive ? 'deactivated' : 'activated'}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to toggle');
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Tax Configuration</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Configure GST/VAT and tax rules for orders</p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Tax Config
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tax Configs Table */}
        <div className="lg:col-span-2">
          <Card className="border-border shadow-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  <Percent className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base font-heading font-semibold">Tax Rules</CardTitle>
                  <CardDescription className="text-xs">All configured tax rates</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
                </div>
              ) : !taxConfigs || taxConfigs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Percent className="w-10 h-10 text-muted-foreground mb-3" />
                  <p className="font-medium text-foreground text-sm">No tax configs yet</p>
                  <p className="text-muted-foreground text-xs mt-1">Add your first tax rule above.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        {['Name', 'Rate', 'Applies To', 'Status', 'Actions'].map(h => (
                          <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {taxConfigs.map(tc => (
                        <tr key={tc.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                          <td className="py-3 px-3 font-semibold text-foreground">{tc.name}</td>
                          <td className="py-3 px-3 font-mono text-primary font-bold">{tc.rate}%</td>
                          <td className="py-3 px-3">
                            <Badge variant="outline" className="text-xs">{appliesToLabel(tc.appliesTo)}</Badge>
                          </td>
                          <td className="py-3 px-3">
                            <Badge
                              variant={tc.isActive ? 'default' : 'secondary'}
                              className={tc.isActive ? 'bg-primary/10 text-primary border-primary/20' : ''}
                            >
                              {tc.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleToggle(tc)}
                                disabled={toggleMutation.isPending}
                                className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                                title={tc.isActive ? 'Deactivate' : 'Activate'}
                              >
                                {tc.isActive
                                  ? <ToggleRight className="w-4 h-4 text-primary" />
                                  : <ToggleLeft className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => openEdit(tc)}
                                className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(tc)}
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
        </div>

        {/* Live Preview */}
        <div>
          <LiveTaxPreview />
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingConfig ? 'Edit Tax Config' : 'Add Tax Config'}</DialogTitle>
            <DialogDescription>
              {editingConfig ? 'Update the tax configuration.' : 'Create a new tax rule for orders.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="tc-name">Name <span className="text-destructive">*</span></Label>
              <Input
                id="tc-name"
                placeholder="e.g. GST, VAT"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tc-rate">Rate (%) <span className="text-destructive">*</span></Label>
              <Input
                id="tc-rate"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="e.g. 10"
                value={form.rate}
                onChange={e => setForm(f => ({ ...f, rate: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tc-applies">Applies To</Label>
              <Select
                value={form.appliesTo}
                onValueChange={v => setForm(f => ({ ...f, appliesTo: v as 'all' | 'menuItems' | 'combos' }))}
              >
                <SelectTrigger id="tc-applies">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="menuItems">Menu Items</SelectItem>
                  <SelectItem value="combos">Combos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formError && (
              <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{formError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : editingConfig ? 'Update' : 'Create'}
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
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
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
