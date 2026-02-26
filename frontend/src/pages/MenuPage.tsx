import React, { useState } from 'react';
import {
  useMenuItems,
  useCreateMenuItem,
  useUpdateMenuItem,
  useDeleteMenuItem,
  useToggleMenuItemAvailability,
  useIngredients,
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
import { Plus, Edit, Trash2, ChefHat, Loader2, TrendingUp, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function MenuPage() {
  const { data: menuItems = [], isLoading } = useMenuItems();
  const { data: ingredients = [] } = useIngredients();
  const createMenuItem = useCreateMenuItem();
  const updateMenuItem = useUpdateMenuItem();
  const deleteMenuItem = useDeleteMenuItem();
  const toggleAvailability = useToggleMenuItemAvailability();

  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    sellingPrice: 0,
    ingredients: [] as [string, number][],
    isAvailable: true,
    availableFromHour: undefined as number | undefined,
    availableToHour: undefined as number | undefined,
    availableDays: undefined as number[] | undefined,
  });

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const openAdd = () => {
    setEditingItem(null);
    setForm({
      name: '',
      description: '',
      sellingPrice: 0,
      ingredients: [],
      isAvailable: true,
      availableFromHour: undefined,
      availableToHour: undefined,
      availableDays: undefined,
    });
    setShowDialog(true);
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
    setShowDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      await updateMenuItem.mutateAsync({ id: editingItem.id, item: form });
    } else {
      await createMenuItem.mutateAsync(form);
    }
    setShowDialog(false);
  };

  const toggleIngredient = (name: string) => {
    setForm(f => {
      const exists = f.ingredients.find(([n]) => n === name);
      if (exists) {
        return { ...f, ingredients: f.ingredients.filter(([n]) => n !== name) };
      }
      return { ...f, ingredients: [...f.ingredients, [name, 1]] };
    });
  };

  const updateIngredientQty = (name: string, qty: number) => {
    setForm(f => ({
      ...f,
      ingredients: f.ingredients.map(([n, q]) => n === name ? [n, qty] : [n, q]),
    }));
  };

  const toggleDay = (day: number) => {
    setForm(f => {
      const days = f.availableDays ?? [];
      return {
        ...f,
        availableDays: days.includes(day) ? days.filter(d => d !== day) : [...days, day],
      };
    });
  };

  const getProfitMargin = (item: MenuItem) => {
    if (item.sellingPrice === 0) return 0;
    return ((item.sellingPrice - item.costPerServing) / item.sellingPrice) * 100;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Menu</h1>
        <Button onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" /> Add Item
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      ) : menuItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <ChefHat className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No menu items yet. Add your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuItems.map(item => {
            const margin = getProfitMargin(item);
            const isExpanded = expandedId === item.id;
            return (
              <Card key={item.id} className={!item.isAvailable ? 'opacity-60' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{item.name}</CardTitle>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {margin >= 0 ? (
                        <Badge variant="outline" className="text-green-600 border-green-300 text-xs">
                          <TrendingUp className="h-3 w-3 mr-1" />{margin.toFixed(1)}%
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-600 border-red-300 text-xs">
                          <TrendingDown className="h-3 w-3 mr-1" />{margin.toFixed(1)}%
                        </Badge>
                      )}
                      <Badge variant={item.isAvailable ? 'default' : 'secondary'}>
                        {item.isAvailable ? 'Available' : 'Off'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                  <p className="text-lg font-bold text-primary">${item.sellingPrice.toFixed(2)}</p>
                  {(item.availableFromHour !== undefined || item.availableDays) && (
                    <Badge variant="outline" className="text-xs">
                      {item.availableFromHour !== undefined && item.availableToHour !== undefined
                        ? `${item.availableFromHour}:00–${item.availableToHour}:00`
                        : ''}
                      {item.availableDays && item.availableDays.length > 0
                        ? ` ${item.availableDays.map(d => DAYS[d]).join(', ')}`
                        : ''}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  >
                    {isExpanded ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                    {isExpanded ? 'Hide' : 'Show'} Cost Breakdown
                  </Button>
                  {isExpanded && (
                    <div className="text-xs space-y-1 bg-muted/50 rounded p-2">
                      <div className="flex justify-between">
                        <span>Cost/Serving</span>
                        <span>${item.costPerServing.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Selling Price</span>
                        <span>${item.sellingPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Gross Profit</span>
                        <span>${(item.sellingPrice - item.costPerServing).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Margin</span>
                        <span className={margin >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {margin.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAvailability.mutate(item.id)}
                    >
                      {item.isAvailable ? 'Disable' : 'Enable'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
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
                          <AlertDialogTitle>Delete Menu Item</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{item.name}"?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMenuItem.mutate(item.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
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
              <Label htmlFor="sellingPrice">Selling Price *</Label>
              <Input
                id="sellingPrice"
                type="number"
                min={0}
                step="0.01"
                value={form.sellingPrice}
                onChange={e => setForm(f => ({ ...f, sellingPrice: parseFloat(e.target.value) || 0 }))}
                required
              />
            </div>
            <div>
              <Label>Ingredients</Label>
              <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto mt-1">
                {ingredients.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No ingredients available.</p>
                ) : (
                  ingredients.map(ing => {
                    const selected = form.ingredients.find(([n]) => n === ing.name);
                    return (
                      <div key={ing.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`ing-${ing.id}`}
                          checked={!!selected}
                          onCheckedChange={() => toggleIngredient(ing.name)}
                        />
                        <label htmlFor={`ing-${ing.id}`} className="text-sm flex-1 cursor-pointer">
                          {ing.name}
                        </label>
                        {selected && (
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={selected[1]}
                            onChange={e => updateIngredientQty(ing.name, parseFloat(e.target.value) || 0)}
                            className="w-20 h-7 text-xs"
                          />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fromHour">Available From (hour)</Label>
                <Input
                  id="fromHour"
                  type="number"
                  min={0}
                  max={23}
                  placeholder="0-23"
                  value={form.availableFromHour ?? ''}
                  onChange={e => setForm(f => ({
                    ...f,
                    availableFromHour: e.target.value ? parseInt(e.target.value) : undefined,
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="toHour">Available To (hour)</Label>
                <Input
                  id="toHour"
                  type="number"
                  min={0}
                  max={23}
                  placeholder="0-23"
                  value={form.availableToHour ?? ''}
                  onChange={e => setForm(f => ({
                    ...f,
                    availableToHour: e.target.value ? parseInt(e.target.value) : undefined,
                  }))}
                />
              </div>
            </div>
            <div>
              <Label>Available Days</Label>
              <div className="flex gap-2 flex-wrap mt-1">
                {DAYS.map((day, idx) => (
                  <label key={day} className="flex items-center gap-1 cursor-pointer">
                    <Checkbox
                      checked={(form.availableDays ?? []).includes(idx)}
                      onCheckedChange={() => toggleDay(idx)}
                    />
                    <span className="text-sm">{day}</span>
                  </label>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={createMenuItem.isPending || updateMenuItem.isPending}>
                {(createMenuItem.isPending || updateMenuItem.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingItem ? 'Save Changes' : 'Add Item'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
