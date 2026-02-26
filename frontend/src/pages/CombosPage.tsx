import React, { useState } from 'react';
import {
  useCombos,
  useCreateComboDeal,
  useUpdateComboDeal,
  useDeleteComboDeal,
  useToggleComboDealAvailability,
  useMenuItems,
} from '../hooks/useQueries';
import type { ComboDeal, MenuItem } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit, Trash2, Tag, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ComboForm {
  name: string;
  description: string;
  menuItemIds: number[];
  bundlePrice: number;
  isAvailable: boolean;
}

const emptyForm: ComboForm = {
  name: '',
  description: '',
  menuItemIds: [],
  bundlePrice: 0,
  isAvailable: true,
};

function formatCurrency(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
}

export default function CombosPage() {
  const { data: combos = [], isLoading } = useCombos();
  const { data: menuItems = [] } = useMenuItems();
  const createCombo = useCreateComboDeal();
  const updateCombo = useUpdateComboDeal();
  const deleteCombo = useDeleteComboDeal();
  const toggleCombo = useToggleComboDealAvailability();

  const [showAdd, setShowAdd] = useState(false);
  const [editingCombo, setEditingCombo] = useState<ComboDeal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ComboDeal | null>(null);
  const [form, setForm] = useState<ComboForm>(emptyForm);

  const getMenuItemById = (id: number): MenuItem | undefined =>
    menuItems.find(m => m.id === id);

  const calcTotalIndividualPrice = (ids: number[]) =>
    ids.reduce((sum, id) => sum + (getMenuItemById(id)?.sellingPrice ?? 0), 0);

  const openAdd = () => {
    setForm(emptyForm);
    setShowAdd(true);
  };

  const openEdit = (combo: ComboDeal) => {
    setEditingCombo(combo);
    setForm({
      name: combo.name,
      description: combo.description,
      menuItemIds: combo.menuItemIds,
      bundlePrice: combo.bundlePrice,
      isAvailable: combo.isAvailable,
    });
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const totalIndividualPrice = calcTotalIndividualPrice(form.menuItemIds);
    const savings = Math.max(0, totalIndividualPrice - form.bundlePrice);
    try {
      if (editingCombo) {
        await updateCombo.mutateAsync({
          ...editingCombo,
          ...form,
          totalIndividualPrice,
          savings,
        });
        setEditingCombo(null);
      } else {
        await createCombo.mutateAsync({
          ...form,
          totalIndividualPrice,
          savings,
        });
        setShowAdd(false);
      }
      setForm(emptyForm);
    } catch {
      // handled by mutation
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteCombo.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const toggleMenuItem = (id: number) => {
    setForm(f => ({
      ...f,
      menuItemIds: f.menuItemIds.includes(id)
        ? f.menuItemIds.filter(i => i !== id)
        : [...f.menuItemIds, id],
    }));
  };

  const isSaving = createCombo.isPending || updateCombo.isPending;
  const previewTotal = calcTotalIndividualPrice(form.menuItemIds);
  const previewSavings = Math.max(0, previewTotal - form.bundlePrice);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Combo Deals</h1>
          <p className="text-muted-foreground text-sm mt-1">Create and manage bundle deals</p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Combo
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : combos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Tag className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No combo deals yet. Create your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {combos.map(combo => (
            <Card key={combo.id} className={`border-border ${!combo.isAvailable ? 'opacity-60' : ''}`}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{combo.name}</p>
                    {combo.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{combo.description}</p>
                    )}
                  </div>
                  <Switch
                    checked={combo.isAvailable}
                    onCheckedChange={() => toggleCombo.mutate(combo.id)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-primary">{formatCurrency(combo.bundlePrice)}</span>
                  {combo.savings > 0 && (
                    <Badge variant="secondary" className="text-xs text-green-700">
                      Save {formatCurrency(combo.savings)}
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  {combo.menuItemIds.length} item{combo.menuItemIds.length !== 1 ? 's' : ''}
                  {combo.totalIndividualPrice > 0 && ` · ${formatCurrency(combo.totalIndividualPrice)} individually`}
                </p>

                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(combo)}>
                    <Edit className="w-3 h-3 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
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
      <Dialog open={showAdd || !!editingCombo} onOpenChange={open => { if (!open) { setShowAdd(false); setEditingCombo(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCombo ? 'Edit Combo Deal' : 'Add Combo Deal'}</DialogTitle>
            <DialogDescription>Configure the combo bundle details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-1">
              <Label htmlFor="combo-name">Name *</Label>
              <Input id="combo-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="combo-desc">Description</Label>
              <Textarea id="combo-desc" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-1">
              <Label>Menu Items</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-border rounded-lg p-2">
                {menuItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`item-${item.id}`}
                        checked={form.menuItemIds.includes(item.id)}
                        onCheckedChange={() => toggleMenuItem(item.id)}
                      />
                      <Label htmlFor={`item-${item.id}`} className="text-sm cursor-pointer">{item.name}</Label>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatCurrency(item.sellingPrice)}</span>
                  </div>
                ))}
                {menuItems.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">No menu items available.</p>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="bundle-price">Bundle Price *</Label>
              <Input
                id="bundle-price"
                type="number"
                min={0}
                step="0.01"
                value={form.bundlePrice}
                onChange={e => setForm(f => ({ ...f, bundlePrice: parseFloat(e.target.value) || 0 }))}
              />
              {previewTotal > 0 && (
                <p className="text-xs text-muted-foreground">
                  Individual total: {formatCurrency(previewTotal)}
                  {previewSavings > 0 && ` · Saves ${formatCurrency(previewSavings)}`}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAdd(false); setEditingCombo(null); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving || !form.name.trim()}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingCombo ? 'Save Changes' : 'Add Combo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Combo Deal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleteCombo.isPending}
            >
              {deleteCombo.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
