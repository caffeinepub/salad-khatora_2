import React, { useState } from 'react';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, Search, Tag } from 'lucide-react';
import {
  useMenuItems,
  useCreateMenuItem,
  useUpdateMenuItem,
  useDeleteMenuItem,
  useToggleMenuItemAvailability,
  MenuItem,
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

function formatCurrency(amount: number) {
  return `₹${amount.toFixed(2)}`;
}

type MenuItemForm = {
  name: string;
  description: string;
  price: number;
  sellingPrice: number;
  category: string;
  isAvailable: boolean;
  costPerServing: number;
};

const defaultForm: MenuItemForm = {
  name: '',
  description: '',
  price: 0,
  sellingPrice: 0,
  category: '',
  isAvailable: true,
  costPerServing: 0,
};

export default function MenuPage() {
  const { data: menuItems = [], isLoading } = useMenuItems();
  const createMenuItem = useCreateMenuItem();
  const updateMenuItem = useUpdateMenuItem();
  const deleteMenuItem = useDeleteMenuItem();
  const toggleAvailability = useToggleMenuItemAvailability();

  const [search, setSearch] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [form, setForm] = useState<MenuItemForm>(defaultForm);

  const filtered = menuItems.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    (item.category ?? '').toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() {
    setForm(defaultForm);
    setShowAddDialog(true);
  }

  function openEdit(item: MenuItem) {
    setForm({
      name: item.name,
      description: item.description,
      price: item.price,
      sellingPrice: item.sellingPrice ?? item.price,
      category: item.category,
      isAvailable: item.isAvailable,
      costPerServing: item.costPerServing ?? 0,
    });
    setEditingItem(item);
  }

  function closeDialogs() {
    setShowAddDialog(false);
    setEditingItem(null);
  }

  async function handleSave() {
    const payload: Omit<MenuItem, 'id'> = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: form.price,
      sellingPrice: form.sellingPrice || form.price,
      category: form.category.trim(),
      isAvailable: form.isAvailable,
      costPerServing: form.costPerServing,
    };

    if (editingItem) {
      await updateMenuItem.mutateAsync({ ...payload, id: editingItem.id });
    } else {
      await createMenuItem.mutateAsync(payload);
    }
    closeDialogs();
  }

  async function handleDelete() {
    if (deletingId !== null) {
      await deleteMenuItem.mutateAsync(deletingId);
      setDeletingId(null);
    }
  }

  const isSaving = createMenuItem.isPending || updateMenuItem.isPending;
  const isDialogOpen = showAddDialog || !!editingItem;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-40 bg-muted rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Menu</h1>
          <p className="text-muted-foreground">Manage your menu items.</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search menu items..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Tag className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              {search ? 'No items match your search.' : 'No menu items yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => {
            const displayPrice = item.sellingPrice ?? item.price;
            const cost = item.costPerServing ?? 0;
            const margin = displayPrice > 0 && cost > 0
              ? ((displayPrice - cost) / displayPrice) * 100
              : null;

            return (
              <Card key={item.id} className={!item.isAvailable ? 'opacity-60' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{item.name}</CardTitle>
                      {item.category && (
                        <Badge variant="secondary" className="text-xs mt-1">{item.category}</Badge>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => toggleAvailability.mutate(item.id)}
                      >
                        {item.isAvailable
                          ? <ToggleRight className="h-4 w-4 text-primary" />
                          : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => setDeletingId(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {item.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary text-lg">{formatCurrency(displayPrice)}</span>
                    {margin !== null && (
                      <span className="text-xs text-muted-foreground">{margin.toFixed(0)}% margin</span>
                    )}
                  </div>
                  {cost > 0 && (
                    <div className="text-xs text-muted-foreground flex justify-between">
                      <span>Cost: {formatCurrency(cost)}</span>
                      <span>Profit: {formatCurrency(displayPrice - cost)}</span>
                    </div>
                  )}
                  {!item.isAvailable && (
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            <div>
              <Label>Name *</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} />
            </div>
            <div>
              <Label>Category</Label>
              <Input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="e.g. Main, Salad, Drink" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Selling Price (₹) *</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.sellingPrice}
                  onChange={e => {
                    const val = parseFloat(e.target.value) || 0;
                    setForm(p => ({ ...p, sellingPrice: val, price: val }));
                  }}
                />
              </div>
              <div>
                <Label>Cost/Serving (₹)</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.costPerServing}
                  onChange={e => setForm(p => ({ ...p, costPerServing: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialogs}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving || !form.name.trim()}>
              {isSaving ? 'Saving...' : editingItem ? 'Save Changes' : 'Add Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deletingId !== null} onOpenChange={open => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Menu Item?</AlertDialogTitle>
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
