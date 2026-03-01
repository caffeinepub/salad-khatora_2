import React, { useState } from 'react';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, Package } from 'lucide-react';
import {
  useCombos,
  useCreateCombo,
  useUpdateCombo,
  useDeleteCombo,
  useToggleComboDealAvailability,
  useMenuItems,
  Combo,
} from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Checkbox } from '@/components/ui/checkbox';

function formatCurrency(amount: number) {
  return `₹${amount.toFixed(2)}`;
}

type ComboFormData = {
  name: string;
  description: string;
  price: number;
  items: { menuItemId: number; quantity: number }[];
  isAvailable: boolean;
};

const defaultForm: ComboFormData = {
  name: '',
  description: '',
  price: 0,
  items: [],
  isAvailable: true,
};

export default function CombosPage() {
  const { data: combos = [], isLoading } = useCombos();
  const { data: menuItems = [] } = useMenuItems();
  const createCombo = useCreateCombo();
  const updateCombo = useUpdateCombo();
  const deleteCombo = useDeleteCombo();
  const toggleAvailability = useToggleComboDealAvailability();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [form, setForm] = useState<ComboFormData>(defaultForm);

  const menuItemMap = new Map(menuItems.map(m => [m.id, m]));

  function openAdd() {
    setForm(defaultForm);
    setShowAddDialog(true);
  }

  function openEdit(combo: Combo) {
    setForm({
      name: combo.name,
      description: combo.description,
      price: combo.price,
      items: combo.items,
      isAvailable: combo.isAvailable,
    });
    setEditingCombo(combo);
  }

  function closeDialogs() {
    setShowAddDialog(false);
    setEditingCombo(null);
  }

  function toggleMenuItem(menuItemId: number) {
    setForm(prev => {
      const exists = prev.items.find(i => i.menuItemId === menuItemId);
      if (exists) {
        return { ...prev, items: prev.items.filter(i => i.menuItemId !== menuItemId) };
      } else {
        return { ...prev, items: [...prev.items, { menuItemId, quantity: 1 }] };
      }
    });
  }

  function updateItemQty(menuItemId: number, qty: number) {
    setForm(prev => ({
      ...prev,
      items: prev.items.map(i => i.menuItemId === menuItemId ? { ...i, quantity: qty } : i),
    }));
  }

  // Calculate total individual price
  const totalIndividualPrice = form.items.reduce((sum, item) => {
    const mi = menuItemMap.get(item.menuItemId);
    return sum + (mi ? (mi.sellingPrice ?? mi.price) * item.quantity : 0);
  }, 0);

  async function handleSave() {
    if (editingCombo) {
      await updateCombo.mutateAsync({
        ...editingCombo,
        ...form,
        menuItemIds: form.items.map(i => i.menuItemId),
        bundlePrice: form.price,
        savings: Math.max(0, totalIndividualPrice - form.price),
        totalIndividualPrice,
      });
    } else {
      await createCombo.mutateAsync({
        ...form,
        menuItemIds: form.items.map(i => i.menuItemId),
        bundlePrice: form.price,
        savings: Math.max(0, totalIndividualPrice - form.price),
        totalIndividualPrice,
        imageUrl: undefined,
      });
    }
    closeDialogs();
  }

  async function handleDelete() {
    if (deletingId !== null) {
      await deleteCombo.mutateAsync(deletingId);
      setDeletingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-48 bg-muted rounded-lg" />)}
        </div>
      </div>
    );
  }

  const isDialogOpen = showAddDialog || !!editingCombo;
  const isSaving = createCombo.isPending || updateCombo.isPending;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Combo Deals</h1>
          <p className="text-muted-foreground">Create and manage combo meal deals.</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Combo
        </Button>
      </div>

      {combos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No combo deals yet. Create your first combo!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {combos.map(combo => {
            const comboMenuItemIds = combo.menuItemIds ?? combo.items.map(i => i.menuItemId);
            const savings = combo.savings ?? 0;
            const bundlePrice = combo.bundlePrice ?? combo.price;
            const indivPrice = combo.totalIndividualPrice ?? 0;

            return (
              <Card key={combo.id} className={!combo.isAvailable ? 'opacity-60' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{combo.name}</CardTitle>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => toggleAvailability.mutate(combo.id)}
                      >
                        {combo.isAvailable
                          ? <ToggleRight className="h-4 w-4 text-primary" />
                          : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEdit(combo)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => setDeletingId(combo.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {combo.description && (
                    <p className="text-sm text-muted-foreground">{combo.description}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {comboMenuItemIds.map((id) => {
                      const mi = menuItemMap.get(id);
                      return mi ? (
                        <Badge key={id} variant="secondary" className="text-xs">{mi.name}</Badge>
                      ) : null;
                    })}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      {savings > 0 && (
                        <span className="text-xs text-primary font-medium">
                          Save {formatCurrency(savings)}
                        </span>
                      )}
                      {indivPrice > 0 && (
                        <span className="text-xs text-muted-foreground ml-2">
                          {formatCurrency(indivPrice)} individually
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-primary">{formatCurrency(bundlePrice)}</span>
                  </div>
                  {!combo.isAvailable && (
                    <Badge variant="outline" className="text-xs">Unavailable</Badge>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={open => !open && closeDialogs()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCombo ? 'Edit Combo' : 'Add Combo Deal'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} />
            </div>
            <div>
              <Label>Bundle Price (₹)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.price}
                onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) }))}
              />
              {totalIndividualPrice > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Individual total: {formatCurrency(totalIndividualPrice)}
                  {totalIndividualPrice > form.price && (
                    <span className="text-primary ml-1">
                      (Save {formatCurrency(totalIndividualPrice - form.price)})
                    </span>
                  )}
                </p>
              )}
            </div>
            <div>
              <Label className="mb-2 block">Menu Items</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                {menuItems.map(mi => {
                  const selected = form.items.find(i => i.menuItemId === mi.id);
                  return (
                    <div key={mi.id} className="flex items-center gap-3">
                      <Checkbox
                        checked={!!selected}
                        onCheckedChange={() => toggleMenuItem(mi.id)}
                        id={`mi-${mi.id}`}
                      />
                      <label htmlFor={`mi-${mi.id}`} className="flex-1 text-sm cursor-pointer">
                        {mi.name} — {formatCurrency(mi.sellingPrice ?? mi.price)}
                      </label>
                      {selected && (
                        <Input
                          type="number"
                          min={1}
                          value={selected.quantity}
                          onChange={e => updateItemQty(mi.id, Number(e.target.value))}
                          className="w-16 h-7 text-xs"
                        />
                      )}
                    </div>
                  );
                })}
                {menuItems.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">No menu items available.</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialogs}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving || !form.name}>
              {isSaving ? 'Saving...' : editingCombo ? 'Save Changes' : 'Create Combo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deletingId !== null} onOpenChange={open => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Combo?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
