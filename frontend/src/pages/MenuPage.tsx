import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useMenuItems,
  useCreateMenuItem,
  useUpdateMenuItem,
  useDeleteMenuItem,
  useToggleMenuItemAvailability,
  useIngredients,
  useProfitMargin,
} from '../hooks/useQueries';
import type { MenuItem } from '../backend';
import {
  Plus, Pencil, Trash2, UtensilsCrossed, Loader2, Search, X, ChevronDown, ChevronUp,
  Clock, TrendingUp, TrendingDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
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

interface IngredientRow {
  name: string;
  quantity: number;
}

interface MenuItemFormData {
  name: string;
  description: string;
  sellingPrice: string;
  isAvailable: boolean;
  ingredients: IngredientRow[];
  availableFromHour: string;
  availableToHour: string;
  availableDays: number[];
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const emptyForm: MenuItemFormData = {
  name: '',
  description: '',
  sellingPrice: '',
  isAvailable: true,
  ingredients: [],
  availableFromHour: '',
  availableToHour: '',
  availableDays: [],
};

function menuItemToForm(item: MenuItem): MenuItemFormData {
  return {
    name: item.name,
    description: item.description,
    sellingPrice: item.sellingPrice.toString(),
    isAvailable: item.isAvailable,
    ingredients: item.ingredients.map(([name, quantity]) => ({ name, quantity })),
    availableFromHour: item.availableFromHour !== undefined && item.availableFromHour !== null
      ? item.availableFromHour.toString()
      : '',
    availableToHour: item.availableToHour !== undefined && item.availableToHour !== null
      ? item.availableToHour.toString()
      : '',
    availableDays: item.availableDays
      ? item.availableDays.map(d => Number(d))
      : [],
  };
}

function formatScheduleSummary(item: MenuItem): string | null {
  const hasDays = item.availableDays && item.availableDays.length > 0;
  const hasHours = item.availableFromHour !== undefined && item.availableFromHour !== null
    || item.availableToHour !== undefined && item.availableToHour !== null;

  if (!hasDays && !hasHours) return null;

  const parts: string[] = [];

  if (hasDays && item.availableDays) {
    const dayNums = item.availableDays.map(d => Number(d)).sort((a, b) => a - b);
    parts.push(dayNums.map(d => DAY_LABELS[d]).join(', '));
  }

  if (hasHours) {
    const from = item.availableFromHour !== undefined && item.availableFromHour !== null
      ? `${String(Number(item.availableFromHour)).padStart(2, '0')}:00`
      : '00:00';
    const to = item.availableToHour !== undefined && item.availableToHour !== null
      ? `${String(Number(item.availableToHour)).padStart(2, '0')}:00`
      : '24:00';
    parts.push(`${from}–${to}`);
  }

  return parts.join(' · ');
}

// Sub-component to show profit margin badge per item (uses its own hook call)
function ProfitMarginBadge({ item }: { item: MenuItem }) {
  const { data: margin, isLoading } = useProfitMargin(item.id);

  if (isLoading) {
    return <Skeleton className="h-5 w-16 rounded-full" />;
  }

  if (!margin) return null;

  const pct = margin.profitMarginPercentage;
  const isPositive = pct >= 0;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full',
        isPositive
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      )}
    >
      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {pct.toFixed(1)}%
    </span>
  );
}

// Sub-component for expanded cost breakdown
function CostBreakdown({ item, formatCurrency }: { item: MenuItem; formatCurrency: (v: number) => string }) {
  const { data: margin, isLoading } = useProfitMargin(item.id);

  if (isLoading) {
    return (
      <div className="space-y-1.5 mt-2">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-4 w-full" />)}
      </div>
    );
  }

  if (!margin) return null;

  const rows = [
    { label: 'Cost per Serving', value: formatCurrency(margin.costPerServing), muted: false },
    { label: 'Selling Price', value: formatCurrency(margin.sellingPrice), muted: false },
    { label: 'Gross Profit', value: formatCurrency(margin.grossProfit), muted: false },
    { label: 'Profit Margin', value: `${margin.profitMarginPercentage.toFixed(1)}%`, muted: false },
  ];

  return (
    <div className="mt-2 rounded-xl bg-secondary/60 p-2.5 space-y-1.5">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Cost Breakdown</p>
      {rows.map(({ label, value }) => (
        <div key={label} className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{label}</span>
          <span className={cn(
            'font-medium',
            label === 'Gross Profit' && margin.grossProfit < 0 ? 'text-destructive' : 'text-foreground'
          )}>{value}</span>
        </div>
      ))}
    </div>
  );
}

export default function MenuPage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();

  const { data: menuItems, isLoading } = useMenuItems();
  const { data: ingredients } = useIngredients();
  const createMenuItem = useCreateMenuItem();
  const updateMenuItem = useUpdateMenuItem();
  const deleteMenuItem = useDeleteMenuItem();
  const toggleAvailability = useToggleMenuItemAvailability();

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<MenuItemFormData>(emptyForm);
  const [formError, setFormError] = useState('');
  const [expandedId, setExpandedId] = useState<bigint | null>(null);

  useEffect(() => {
    if (!identity) navigate({ to: '/login' });
  }, [identity, navigate]);

  const openAdd = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setFormError('');
    setDialogOpen(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditingItem(item);
    setForm(menuItemToForm(item));
    setFormError('');
    setDialogOpen(true);
  };

  const handleFormChange = (field: keyof MenuItemFormData, value: string | boolean | number[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleDay = (day: number) => {
    setForm((prev) => {
      const days = prev.availableDays.includes(day)
        ? prev.availableDays.filter(d => d !== day)
        : [...prev.availableDays, day];
      return { ...prev, availableDays: days };
    });
  };

  const addIngredientRow = () => {
    setForm((prev) => ({ ...prev, ingredients: [...prev.ingredients, { name: '', quantity: 0 }] }));
  };

  const removeIngredientRow = (index: number) => {
    setForm((prev) => ({ ...prev, ingredients: prev.ingredients.filter((_, i) => i !== index) }));
  };

  const updateIngredientRow = (index: number, field: 'name' | 'quantity', value: string | number) => {
    setForm((prev) => {
      const updated = [...prev.ingredients];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, ingredients: updated };
    });
  };

  const validateForm = (): boolean => {
    if (!form.name.trim()) { setFormError('Name is required.'); return false; }
    const price = parseFloat(form.sellingPrice);
    if (isNaN(price) || price < 0) { setFormError('Enter a valid selling price.'); return false; }
    if (form.availableFromHour !== '') {
      const h = parseInt(form.availableFromHour);
      if (isNaN(h) || h < 0 || h > 23) { setFormError('Available From hour must be 0–23.'); return false; }
    }
    if (form.availableToHour !== '') {
      const h = parseInt(form.availableToHour);
      if (isNaN(h) || h < 0 || h > 23) { setFormError('Available To hour must be 0–23.'); return false; }
    }
    for (const ing of form.ingredients) {
      if (!ing.name.trim()) { setFormError('All ingredient names must be filled.'); return false; }
      if (ing.quantity <= 0) { setFormError('All ingredient quantities must be greater than 0.'); return false; }
    }
    setFormError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    const ingredientsList: [string, number][] = form.ingredients.map((r) => [r.name, r.quantity]);
    const price = parseFloat(form.sellingPrice);

    const availableFromHour = form.availableFromHour !== '' ? BigInt(parseInt(form.availableFromHour)) : undefined;
    const availableToHour = form.availableToHour !== '' ? BigInt(parseInt(form.availableToHour)) : undefined;
    const availableDays = form.availableDays.length > 0 ? form.availableDays.map(d => BigInt(d)) : undefined;

    try {
      if (editingItem) {
        await updateMenuItem.mutateAsync({
          id: editingItem.id,
          item: {
            name: form.name.trim(),
            description: form.description.trim(),
            sellingPrice: price,
            isAvailable: form.isAvailable,
            ingredients: ingredientsList,
            availableFromHour,
            availableToHour,
            availableDays,
          },
        });
      } else {
        await createMenuItem.mutateAsync({
          name: form.name.trim(),
          description: form.description.trim(),
          sellingPrice: price,
          ingredients: ingredientsList,
          availableFromHour,
          availableToHour,
          availableDays,
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
      await deleteMenuItem.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // silently handled
    }
  };

  const handleToggle = async (item: MenuItem) => {
    try {
      await toggleAvailability.mutateAsync(item.id);
    } catch {
      // silently handled
    }
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(v);

  const filtered = (menuItems ?? []).filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.description.toLowerCase().includes(search.toLowerCase())
  );

  const isMutating = createMenuItem.isPending || updateMenuItem.isPending;

  // Build ingredient name suggestions from inventory
  const ingredientNames = (ingredients ?? []).map(i => i.name);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Menu Management</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage your restaurant's menu items, pricing, and availability
          </p>
        </div>
        <Button onClick={openAdd} className="self-start sm:self-auto flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Menu Item
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search menu items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
            <UtensilsCrossed className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-heading font-semibold text-lg text-foreground mb-1">
            {search ? 'No items found' : 'No menu items yet'}
          </h3>
          <p className="text-muted-foreground text-sm max-w-xs">
            {search ? 'Try a different search term.' : 'Add your first menu item to get started.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const scheduleSummary = formatScheduleSummary(item);
            const isExpanded = expandedId === item.id;

            return (
              <Card
                key={item.id.toString()}
                className={cn(
                  'border-border shadow-sm hover:shadow-md transition-all',
                  !item.isAvailable && 'opacity-60'
                )}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-heading truncate">{item.name}</CardTitle>
                      <CardDescription className="text-xs mt-0.5 line-clamp-2">{item.description}</CardDescription>
                    </div>
                    <Badge
                      variant={item.isAvailable ? 'default' : 'secondary'}
                      className="text-xs flex-shrink-0"
                    >
                      {item.isAvailable ? 'Available' : 'Unavailable'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-primary font-heading">
                      {formatCurrency(item.sellingPrice)}
                    </span>
                    <div className="flex items-center gap-2">
                      <ProfitMarginBadge item={item} />
                      <Switch
                        checked={item.isAvailable}
                        onCheckedChange={() => handleToggle(item)}
                        className="scale-75"
                      />
                    </div>
                  </div>

                  {/* Schedule badge */}
                  {scheduleSummary && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/60 rounded-lg px-2 py-1">
                      <Clock className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{scheduleSummary}</span>
                    </div>
                  )}

                  {/* Ingredients / Cost toggle */}
                  <div>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {item.ingredients.length > 0
                        ? `${item.ingredients.length} ingredient${item.ingredients.length !== 1 ? 's' : ''} · Cost details`
                        : 'Cost details'}
                    </button>

                    {isExpanded && (
                      <div className="mt-2 space-y-1">
                        {item.ingredients.length > 0 && (
                          <>
                            {item.ingredients.map(([name, qty]) => (
                              <div key={name} className="flex items-center justify-between text-xs px-2 py-1 rounded-lg bg-secondary">
                                <span className="text-foreground">{name}</span>
                                <span className="text-muted-foreground">{qty}</span>
                              </div>
                            ))}
                          </>
                        )}
                        <CostBreakdown item={item} formatCurrency={formatCurrency} />
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 text-xs"
                      onClick={() => openEdit(item)}
                    >
                      <Pencil className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
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
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update the details for this menu item.' : 'Fill in the details for the new menu item.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {formError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {formError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="menu-name">Name *</Label>
              <Input
                id="menu-name"
                placeholder="e.g. Caesar Salad"
                value={form.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="menu-desc">Description</Label>
              <Textarea
                id="menu-desc"
                placeholder="Describe the menu item..."
                value={form.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="menu-price">Selling Price *</Label>
              <Input
                id="menu-price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.sellingPrice}
                onChange={(e) => handleFormChange('sellingPrice', e.target.value)}
              />
            </div>

            {editingItem && (
              <div className="flex items-center gap-3">
                <Switch
                  id="menu-available"
                  checked={form.isAvailable}
                  onCheckedChange={(v) => handleFormChange('isAvailable', v)}
                />
                <Label htmlFor="menu-available">Available</Label>
              </div>
            )}

            {/* Ingredients */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Ingredients</Label>
                <Button type="button" variant="outline" size="sm" onClick={addIngredientRow} className="h-7 text-xs">
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </Button>
              </div>
              {form.ingredients.length === 0 ? (
                <p className="text-xs text-muted-foreground">No ingredients added yet.</p>
              ) : (
                <div className="space-y-2">
                  {form.ingredients.map((row, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <Input
                        placeholder="Ingredient name"
                        value={row.name}
                        onChange={(e) => updateIngredientRow(idx, 'name', e.target.value)}
                        list="ingredient-suggestions"
                        className="flex-1 h-8 text-sm"
                      />
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Qty"
                        value={row.quantity || ''}
                        onChange={(e) => updateIngredientRow(idx, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-20 h-8 text-sm"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => removeIngredientRow(idx)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  <datalist id="ingredient-suggestions">
                    {ingredientNames.map(name => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>
                </div>
              )}
            </div>

            <Separator />

            {/* Time-based Availability */}
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-semibold">Time-Based Availability</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Optionally restrict when this item is available. Leave blank for always available.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="from-hour" className="text-xs">Available From (hour 0–23)</Label>
                  <Input
                    id="from-hour"
                    type="number"
                    min="0"
                    max="23"
                    placeholder="e.g. 9"
                    value={form.availableFromHour}
                    onChange={(e) => handleFormChange('availableFromHour', e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="to-hour" className="text-xs">Available To (hour 0–23)</Label>
                  <Input
                    id="to-hour"
                    type="number"
                    min="0"
                    max="23"
                    placeholder="e.g. 22"
                    value={form.availableToHour}
                    onChange={(e) => handleFormChange('availableToHour', e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Available Days (leave unchecked for all days)</Label>
                <div className="flex flex-wrap gap-2">
                  {DAY_FULL.map((day, idx) => (
                    <label
                      key={idx}
                      className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs cursor-pointer transition-colors select-none',
                        form.availableDays.includes(idx)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                      )}
                    >
                      <Checkbox
                        checked={form.availableDays.includes(idx)}
                        onCheckedChange={() => toggleDay(idx)}
                        className="hidden"
                      />
                      {DAY_LABELS[idx]}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isMutating}>Cancel</Button>
            </DialogClose>
            <Button onClick={handleSubmit} disabled={isMutating}>
              {isMutating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingItem ? 'Save Changes' : 'Add Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
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
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMenuItem.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
