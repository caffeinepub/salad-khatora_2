import React, { useState } from 'react';
import {
  useMenuItems,
  useCreateMenuItem,
  useUpdateMenuItem,
  useDeleteMenuItem,
  useToggleMenuItemAvailability,
} from '../hooks/useQueries';
import type { MenuItem } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Edit, Trash2, UtensilsCrossed, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface MenuItemForm {
  name: string;
  description: string;
  sellingPrice: number;
  ingredients: [string, number][];
  isAvailable: boolean;
  availableFromHour?: number;
  availableToHour?: number;
  availableDays?: number[];
}

const emptyForm: MenuItemForm = {
  name: '',
  description: '',
  sellingPrice: 0,
  ingredients: [],
  isAvailable: true,
  availableFromHour: undefined,
  availableToHour: undefined,
  availableDays: undefined,
};

function formatCurrency(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
}

function getProfitMargin(item: MenuItem): number {
  if (item.sellingPrice === 0) return 0;
  return ((item.sellingPrice - item.costPerServing) / item.sellingPrice) * 100;
}

export default function MenuPage() {
  const { data: menuItems = [], isLoading } = useMenuItems();
  const createMenuItem = useCreateMenuItem();
  const updateMenuItem = useUpdateMenuItem();
  const deleteMenuItem = useDeleteMenuItem();
  const toggleAvailability = useToggleMenuItemAvailability();

  const [showAdd, setShowAdd] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<MenuItemForm>(emptyForm);

  const openAdd = () => {
    setForm(emptyForm);
    setShowAdd(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      description: item.description,
      sellingPrice: item.sellingPrice,
      ingredients: item.ingredients,
      isAvailable: item.isAvailable,
      availableFromHour: item.availableFromHour,
      availableToHour: item.availableToHour,
      availableDays: item.availableDays,
    });
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    try {
      if (editingItem) {
        await updateMenuItem.mutateAsync({
          ...editingItem,
          ...form,
        });
        setEditingItem(null);
      } else {
        await createMenuItem.mutateAsync({
          ...form,
          costPerServing: 0,
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
    await deleteMenuItem.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const isSaving = createMenuItem.isPending || updateMenuItem.isPending;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Menu</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your menu items and pricing</p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Item
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : menuItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <UtensilsCrossed className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No menu items yet. Add your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuItems.map(item => {
            const margin = getProfitMargin(item);
            const isPositive = margin >= 0;
            return (
              <Card key={item.id} className={`border-border ${!item.isAvailable ? 'opacity-60' : ''}`}>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{item.name}</p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
                      )}
                    </div>
                    <Switch
                      checked={item.isAvailable}
                      onCheckedChange={() => toggleAvailability.mutate(item.id)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-primary">{formatCurrency(item.sellingPrice)}</p>
                    <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-green-600' : 'text-destructive'}`}>
                      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(margin).toFixed(1)}% margin
                    </div>
                  </div>

                  {(item.availableFromHour !== undefined || item.availableDays) && (
                    <Badge variant="secondary" className="text-xs">
                      {item.availableFromHour !== undefined && item.availableToHour !== undefined
                        ? `${item.availableFromHour}:00–${item.availableToHour}:00`
                        : 'Scheduled'}
                      {item.availableDays && item.availableDays.length > 0 && ` · ${item.availableDays.length}d/wk`}
                    </Badge>
                  )}

                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <div className="flex justify-between">
                      <span>Cost/serving</span>
                      <span>{formatCurrency(item.costPerServing)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gross profit</span>
                      <span>{formatCurrency(item.sellingPrice - item.costPerServing)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(item)}>
                      <Edit className="w-3 h-3 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(item)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showAdd || !!editingItem} onOpenChange={open => { if (!open) { setShowAdd(false); setEditingItem(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
            <DialogDescription>Fill in the details for this menu item.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-1">
              <Label htmlFor="item-name">Name *</Label>
              <Input id="item-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="item-desc">Description</Label>
              <Textarea id="item-desc" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="item-price">Selling Price *</Label>
              <Input
                id="item-price"
                type="number"
                min={0}
                step="0.01"
                value={form.sellingPrice}
                onChange={e => setForm(f => ({ ...f, sellingPrice: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="from-hour">Available From (hour)</Label>
                <Input
                  id="from-hour"
                  type="number"
                  min={0}
                  max={23}
                  placeholder="e.g. 9"
                  value={form.availableFromHour ?? ''}
                  onChange={e => setForm(f => ({ ...f, availableFromHour: e.target.value ? parseInt(e.target.value) : undefined }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="to-hour">Available To (hour)</Label>
                <Input
                  id="to-hour"
                  type="number"
                  min={0}
                  max={23}
                  placeholder="e.g. 22"
                  value={form.availableToHour ?? ''}
                  onChange={e => setForm(f => ({ ...f, availableToHour: e.target.value ? parseInt(e.target.value) : undefined }))}
                />
              </div>
            </div>
            {editingItem && (
              <div className="flex items-center gap-3">
                <Switch
                  id="item-available"
                  checked={form.isAvailable}
                  onCheckedChange={v => setForm(f => ({ ...f, isAvailable: v }))}
                />
                <Label htmlFor="item-available">Available</Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAdd(false); setEditingItem(null); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving || !form.name.trim()}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingItem ? 'Save Changes' : 'Add Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Menu Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleteMenuItem.isPending}
            >
              {deleteMenuItem.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
