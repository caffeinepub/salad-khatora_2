import React, { useState } from 'react';
import {
  useCombos,
  useCreateComboDeal,
  useUpdateComboDeal,
  useDeleteComboDeal,
  useToggleComboDealAvailability,
  useAvailableMenuItems,
  ComboDeal,
  MenuItem,
} from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit, Trash2, Package, Loader2, Tag } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function CombosPage() {
  const { data: combos = [], isLoading } = useCombos();
  const { data: menuItems = [] } = useAvailableMenuItems();
  const createCombo = useCreateComboDeal();
  const updateCombo = useUpdateComboDeal();
  const deleteCombo = useDeleteComboDeal();
  const toggleAvailability = useToggleComboDealAvailability();

  const [showDialog, setShowDialog] = useState(false);
  const [editingCombo, setEditingCombo] = useState<ComboDeal | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    menuItemIds: [] as number[],
    bundlePrice: 0,
    isAvailable: true,
  });

  const openAdd = () => {
    setEditingCombo(null);
    setForm({ name: '', description: '', menuItemIds: [], bundlePrice: 0, isAvailable: true });
    setShowDialog(true);
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
    setShowDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCombo) {
      await updateCombo.mutateAsync({ id: editingCombo.id, ...form });
    } else {
      await createCombo.mutateAsync(form);
    }
    setShowDialog(false);
  };

  const toggleMenuItem = (id: number) => {
    setForm(f => ({
      ...f,
      menuItemIds: f.menuItemIds.includes(id)
        ? f.menuItemIds.filter(i => i !== id)
        : [...f.menuItemIds, id],
    }));
  };

  const totalIndividualPrice = form.menuItemIds.reduce((sum, id) => {
    const item = menuItems.find((m: MenuItem) => m.id === id);
    return sum + (item?.sellingPrice ?? 0);
  }, 0);

  const savings = totalIndividualPrice - form.bundlePrice;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Combo Deals</h1>
        <Button onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" /> Add Combo
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      ) : combos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No combo deals yet. Create your first one!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {combos.map(combo => (
            <Card key={combo.id} className={!combo.isAvailable ? 'opacity-60' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{combo.name}</CardTitle>
                  <Badge variant={combo.isAvailable ? 'default' : 'secondary'}>
                    {combo.isAvailable ? 'Available' : 'Unavailable'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{combo.description}</p>
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-lg font-bold text-primary">${combo.bundlePrice.toFixed(2)}</span>
                  {combo.savings > 0 && (
                    <Badge variant="outline" className="text-green-600 border-green-300">
                      Save ${combo.savings.toFixed(2)}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {combo.menuItemIds.length} item{combo.menuItemIds.length !== 1 ? 's' : ''}
                </p>
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={() => toggleAvailability.mutate(combo.id)}>
                    {combo.isAvailable ? 'Disable' : 'Enable'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openEdit(combo)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Combo Deal</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{combo.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteCombo.mutate(combo.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCombo ? 'Edit Combo Deal' : 'Add Combo Deal'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div>
              <Label>Menu Items</Label>
              <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto mt-1">
                {menuItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No menu items available.</p>
                ) : (
                  menuItems.map((item: MenuItem) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`item-${item.id}`}
                        checked={form.menuItemIds.includes(item.id)}
                        onCheckedChange={() => toggleMenuItem(item.id)}
                      />
                      <label htmlFor={`item-${item.id}`} className="text-sm flex-1 cursor-pointer">
                        {item.name}
                      </label>
                      <span className="text-sm text-muted-foreground">${item.sellingPrice.toFixed(2)}</span>
                    </div>
                  ))
                )}
              </div>
              {form.menuItemIds.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Individual total: ${totalIndividualPrice.toFixed(2)}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="bundlePrice">Bundle Price *</Label>
              <Input
                id="bundlePrice"
                type="number"
                min={0}
                step="0.01"
                value={form.bundlePrice}
                onChange={e => setForm(f => ({ ...f, bundlePrice: parseFloat(e.target.value) || 0 }))}
                required
              />
              {savings > 0 && (
                <p className="text-xs text-green-600 mt-1">Customer saves ${savings.toFixed(2)}</p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={createCombo.isPending || updateCombo.isPending}>
                {(createCombo.isPending || updateCombo.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingCombo ? 'Save Changes' : 'Create Combo'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
