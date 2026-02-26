import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useCombos,
  useCreateComboDeal,
  useUpdateComboDeal,
  useDeleteComboDeal,
  useToggleComboDealAvailability,
  useMenuItems,
} from '../hooks/useQueries';
import type { ComboDeal, MenuItem } from '../backend';
import {
  Plus, Pencil, Trash2, Loader2, Search, Tag, TrendingDown, Package,
  ToggleLeft, ToggleRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
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
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface ComboFormData {
  name: string;
  description: string;
  selectedMenuItemIds: bigint[];
  bundlePrice: string;
  isAvailable: boolean;
}

const emptyForm: ComboFormData = {
  name: '',
  description: '',
  selectedMenuItemIds: [],
  bundlePrice: '',
  isAvailable: true,
};

function comboToForm(combo: ComboDeal): ComboFormData {
  return {
    name: combo.name,
    description: combo.description,
    selectedMenuItemIds: [...combo.menuItemIds],
    bundlePrice: combo.bundlePrice.toString(),
    isAvailable: combo.isAvailable,
  };
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(v);
}

function getMenuItemName(menuItems: MenuItem[], id: bigint): string {
  return menuItems.find(m => m.id === id)?.name ?? `Item #${id}`;
}

export default function CombosPage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();

  const { data: combos, isLoading: combosLoading } = useCombos();
  const { data: menuItems, isLoading: menuItemsLoading } = useMenuItems();
  const createCombo = useCreateComboDeal();
  const updateCombo = useUpdateComboDeal();
  const deleteCombo = useDeleteComboDeal();
  const toggleAvailability = useToggleComboDealAvailability();

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState<ComboDeal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ComboDeal | null>(null);
  const [form, setForm] = useState<ComboFormData>(emptyForm);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!identity) navigate({ to: '/login' });
  }, [identity, navigate]);

  // Live-calculate total individual price and savings from selected items
  const totalIndividualPrice = useMemo(() => {
    if (!menuItems) return 0;
    return form.selectedMenuItemIds.reduce((sum, id) => {
      const item = menuItems.find(m => m.id === id);
      return sum + (item?.sellingPrice ?? 0);
    }, 0);
  }, [form.selectedMenuItemIds, menuItems]);

  const bundlePriceNum = parseFloat(form.bundlePrice) || 0;
  const savings = totalIndividualPrice - bundlePriceNum;

  const openAdd = () => {
    setEditingCombo(null);
    setForm(emptyForm);
    setFormError('');
    setDialogOpen(true);
  };

  const openEdit = (combo: ComboDeal) => {
    setEditingCombo(combo);
    setForm(comboToForm(combo));
    setFormError('');
    setDialogOpen(true);
  };

  const toggleMenuItem = (id: bigint) => {
    setForm(prev => {
      const exists = prev.selectedMenuItemIds.some(x => x === id);
      return {
        ...prev,
        selectedMenuItemIds: exists
          ? prev.selectedMenuItemIds.filter(x => x !== id)
          : [...prev.selectedMenuItemIds, id],
      };
    });
  };

  const validateForm = (): boolean => {
    if (!form.name.trim()) { setFormError('Name is required.'); return false; }
    if (form.selectedMenuItemIds.length === 0) { setFormError('Select at least one menu item.'); return false; }
    const price = parseFloat(form.bundlePrice);
    if (isNaN(price) || price < 0) { setFormError('Enter a valid bundle price.'); return false; }
    setFormError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    const bundlePrice = parseFloat(form.bundlePrice);

    try {
      if (editingCombo) {
        await updateCombo.mutateAsync({
          id: editingCombo.id,
          name: form.name.trim(),
          description: form.description.trim(),
          menuItemIds: form.selectedMenuItemIds,
          bundlePrice,
          isAvailable: form.isAvailable,
        });
      } else {
        await createCombo.mutateAsync({
          name: form.name.trim(),
          description: form.description.trim(),
          menuItemIds: form.selectedMenuItemIds,
          bundlePrice,
        });
      }
      setDialogOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'An error occurred.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCombo.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // silently handled
    }
  };

  const handleToggle = async (combo: ComboDeal) => {
    try {
      await toggleAvailability.mutateAsync(combo.id);
    } catch {
      // silently handled
    }
  };

  const filtered = (combos ?? []).filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.description.toLowerCase().includes(search.toLowerCase())
  );

  const isMutating = createCombo.isPending || updateCombo.isPending;
  const isLoading = combosLoading || menuItemsLoading;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Combo Deals</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Bundle menu items at special prices to boost sales
          </p>
        </div>
        <Button onClick={openAdd} className="self-start sm:self-auto flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Combo
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search combos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-56 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
            <Tag className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-heading font-semibold text-lg text-foreground mb-1">
            {search ? 'No combos found' : 'No combo deals yet'}
          </h3>
          <p className="text-muted-foreground text-sm max-w-xs">
            {search ? 'Try a different search term.' : 'Create your first combo deal to offer bundled pricing.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(combo => (
            <Card
              key={combo.id.toString()}
              className={cn(
                'border-border shadow-sm hover:shadow-md transition-all',
                !combo.isAvailable && 'opacity-60'
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base font-heading truncate">{combo.name}</CardTitle>
                    {combo.description && (
                      <CardDescription className="text-xs mt-0.5 line-clamp-2">{combo.description}</CardDescription>
                    )}
                  </div>
                  <Badge
                    variant={combo.isAvailable ? 'default' : 'secondary'}
                    className="text-xs flex-shrink-0"
                  >
                    {combo.isAvailable ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Pricing */}
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Bundle Price</p>
                    <span className="text-xl font-bold text-primary font-heading">
                      {formatCurrency(combo.bundlePrice)}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground line-through">
                      {formatCurrency(combo.totalIndividualPrice)}
                    </p>
                    {combo.savings > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                        <TrendingDown className="w-3 h-3" />
                        Save {formatCurrency(combo.savings)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    {combo.menuItemIds.length} item{combo.menuItemIds.length !== 1 ? 's' : ''}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {combo.menuItemIds.slice(0, 3).map(id => (
                      <span key={id.toString()} className="text-xs bg-secondary text-foreground px-2 py-0.5 rounded-md">
                        {getMenuItemName(menuItems ?? [], id)}
                      </span>
                    ))}
                    {combo.menuItemIds.length > 3 && (
                      <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-md">
                        +{combo.menuItemIds.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs"
                    onClick={() => openEdit(combo)}
                  >
                    <Pencil className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      'h-8 px-2 text-xs',
                      combo.isAvailable
                        ? 'text-muted-foreground hover:text-foreground'
                        : 'text-primary hover:text-primary'
                    )}
                    onClick={() => handleToggle(combo)}
                    disabled={toggleAvailability.isPending}
                    title={combo.isAvailable ? 'Deactivate' : 'Activate'}
                  >
                    {toggleAvailability.isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : combo.isAvailable ? (
                      <ToggleRight className="w-4 h-4" />
                    ) : (
                      <ToggleLeft className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeleteTarget(combo)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editingCombo ? 'Edit Combo Deal' : 'Add Combo Deal'}
            </DialogTitle>
            <DialogDescription>
              {editingCombo
                ? 'Update the details for this combo deal.'
                : 'Bundle multiple menu items at a special price.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {formError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {formError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="combo-name">Name *</Label>
              <Input
                id="combo-name"
                placeholder="e.g. Family Feast"
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="combo-desc">Description</Label>
              <Textarea
                id="combo-desc"
                placeholder="Describe this combo deal..."
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>

            {/* Menu Item Selector */}
            <div className="space-y-2">
              <Label>Menu Items *</Label>
              {menuItemsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-9 rounded-lg" />)}
                </div>
              ) : (menuItems ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">No menu items available. Add menu items first.</p>
              ) : (
                <div className="border border-border rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  {(menuItems ?? []).map(item => {
                    const isSelected = form.selectedMenuItemIds.some(x => x === item.id);
                    return (
                      <label
                        key={item.id.toString()}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors border-b border-border last:border-b-0',
                          isSelected ? 'bg-primary/5' : 'hover:bg-muted/50'
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleMenuItem(item.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                        </div>
                        <span className="text-sm font-semibold text-primary flex-shrink-0">
                          {formatCurrency(item.sellingPrice)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Live Price Calculation */}
            {form.selectedMenuItemIds.length > 0 && (
              <div className="rounded-xl bg-secondary/60 p-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Price Summary</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Individual Price</span>
                  <span className="font-medium">{formatCurrency(totalIndividualPrice)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Bundle Price</span>
                  <span className="font-medium text-primary">{formatCurrency(bundlePriceNum)}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Customer Savings</span>
                  <span className={cn(
                    'font-semibold',
                    savings > 0 ? 'text-green-600 dark:text-green-400' : savings < 0 ? 'text-destructive' : 'text-muted-foreground'
                  )}>
                    {savings >= 0 ? '+' : ''}{formatCurrency(savings)}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="bundle-price">Bundle Price *</Label>
              <Input
                id="bundle-price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.bundlePrice}
                onChange={(e) => setForm(prev => ({ ...prev, bundlePrice: e.target.value }))}
              />
            </div>

            {editingCombo && (
              <div className="flex items-center gap-3">
                <Label htmlFor="combo-available" className="cursor-pointer">Available</Label>
                <input
                  id="combo-available"
                  type="checkbox"
                  checked={form.isAvailable}
                  onChange={(e) => setForm(prev => ({ ...prev, isAvailable: e.target.checked }))}
                  className="w-4 h-4 accent-primary cursor-pointer"
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSubmit} disabled={isMutating}>
              {isMutating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editingCombo ? 'Update Combo' : 'Create Combo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Combo Deal</AlertDialogTitle>
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
              {deleteCombo.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
