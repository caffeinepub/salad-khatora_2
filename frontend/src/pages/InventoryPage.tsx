import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, AlertTriangle, Loader2, Calendar } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  useIngredients,
  useCreateIngredient,
  useUpdateIngredient,
  useDeleteIngredient,
  useSuppliers,
} from '../hooks/useQueries';
import type { Ingredient } from '../backend';

interface IngredientFormData {
  name: string;
  quantity: string;
  unit: string;
  costPrice: string;
  lowStockThreshold: string;
  supplierId: string;
  expiryDate: string;
}

const emptyForm: IngredientFormData = {
  name: '',
  quantity: '',
  unit: '',
  costPrice: '',
  lowStockThreshold: '',
  supplierId: '',
  expiryDate: '',
};

function validateForm(form: IngredientFormData): string | null {
  if (!form.name.trim()) return 'Name is required';
  if (!form.quantity || isNaN(Number(form.quantity)) || Number(form.quantity) < 0) return 'Valid quantity is required';
  if (!form.unit.trim()) return 'Unit is required';
  if (!form.costPrice || isNaN(Number(form.costPrice)) || Number(form.costPrice) < 0) return 'Valid cost price is required';
  if (!form.lowStockThreshold || isNaN(Number(form.lowStockThreshold)) || Number(form.lowStockThreshold) < 0) return 'Valid low stock threshold is required';
  return null;
}

function isExpiringSoon(expiryDate?: bigint): boolean {
  if (!expiryDate) return false;
  const expiry = new Date(Number(expiryDate) / 1_000_000);
  const days = differenceInDays(expiry, new Date());
  return days >= 0 && days <= 7;
}

function formatExpiryDate(expiryDate?: bigint): string {
  if (!expiryDate) return '-';
  return format(new Date(Number(expiryDate) / 1_000_000), 'MMM d, yyyy');
}

export default function InventoryPage() {
  const { data: ingredients, isLoading, error } = useIngredients();
  const { data: suppliers } = useSuppliers();
  const createIngredient = useCreateIngredient();
  const updateIngredient = useUpdateIngredient();
  const deleteIngredient = useDeleteIngredient();

  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editIngredient, setEditIngredient] = useState<Ingredient | null>(null);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [form, setForm] = useState<IngredientFormData>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'name' | 'quantity' | 'costPrice'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const getSupplierName = (supplierId?: bigint): string => {
    if (!supplierId) return '-';
    const supplier = suppliers?.find(s => s.id === supplierId);
    return supplier?.name ?? '-';
  };

  const filtered = (ingredients ?? [])
    .filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'quantity') cmp = a.quantity - b.quantity;
      else if (sortField === 'costPrice') cmp = a.costPrice - b.costPrice;
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const openAdd = () => {
    setForm(emptyForm);
    setFormError(null);
    setAddOpen(true);
  };

  const openEdit = (ingredient: Ingredient) => {
    setEditIngredient(ingredient);
    setForm({
      name: ingredient.name,
      quantity: ingredient.quantity.toString(),
      unit: ingredient.unit,
      costPrice: ingredient.costPrice.toString(),
      lowStockThreshold: ingredient.lowStockThreshold.toString(),
      supplierId: ingredient.supplierId ? ingredient.supplierId.toString() : '',
      expiryDate: ingredient.expiryDate
        ? format(new Date(Number(ingredient.expiryDate) / 1_000_000), 'yyyy-MM-dd')
        : '',
    });
    setFormError(null);
  };

  const buildPayload = (form: IngredientFormData) => ({
    name: form.name.trim(),
    quantity: Number(form.quantity),
    unit: form.unit.trim(),
    costPrice: Number(form.costPrice),
    lowStockThreshold: Number(form.lowStockThreshold),
    supplierId: form.supplierId ? BigInt(form.supplierId) : undefined,
    expiryDate: form.expiryDate
      ? BigInt(new Date(form.expiryDate).getTime() * 1_000_000)
      : undefined,
  });

  const handleAddSubmit = async () => {
    const err = validateForm(form);
    if (err) { setFormError(err); return; }
    try {
      await createIngredient.mutateAsync(buildPayload(form));
      toast.success('Ingredient added successfully');
      setAddOpen(false);
      setForm(emptyForm);
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to add ingredient');
    }
  };

  const handleEditSubmit = async () => {
    if (!editIngredient) return;
    const err = validateForm(form);
    if (err) { setFormError(err); return; }
    try {
      await updateIngredient.mutateAsync({ id: editIngredient.id, item: buildPayload(form) });
      toast.success('Ingredient updated successfully');
      setEditIngredient(null);
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to update ingredient');
    }
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await deleteIngredient.mutateAsync(deleteId);
      toast.success('Ingredient deleted');
      setDeleteId(null);
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to delete ingredient');
    }
  };

  const toggleSort = (field: 'name' | 'quantity' | 'costPrice') => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const IngredientFormFields = () => (
    <div className="grid gap-4 py-2">
      {formError && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{formError}</p>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="ing-name">Name *</Label>
          <Input
            id="ing-name"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Tomatoes"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ing-unit">Unit *</Label>
          <Input
            id="ing-unit"
            value={form.unit}
            onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
            placeholder="e.g. kg, pcs"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="ing-qty">Quantity *</Label>
          <Input
            id="ing-qty"
            type="number"
            min="0"
            step="0.01"
            value={form.quantity}
            onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
            placeholder="0"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ing-cost">Cost Price *</Label>
          <Input
            id="ing-cost"
            type="number"
            min="0"
            step="0.01"
            value={form.costPrice}
            onChange={e => setForm(f => ({ ...f, costPrice: e.target.value }))}
            placeholder="0.00"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ing-threshold">Low Stock Threshold *</Label>
        <Input
          id="ing-threshold"
          type="number"
          min="0"
          step="0.01"
          value={form.lowStockThreshold}
          onChange={e => setForm(f => ({ ...f, lowStockThreshold: e.target.value }))}
          placeholder="e.g. 5"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ing-supplier">Supplier (optional)</Label>
        <Select
          value={form.supplierId}
          onValueChange={val => setForm(f => ({ ...f, supplierId: val === 'none' ? '' : val }))}
        >
          <SelectTrigger id="ing-supplier">
            <SelectValue placeholder="Select supplier..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No supplier</SelectItem>
            {(suppliers ?? []).map(s => (
              <SelectItem key={s.id.toString()} value={s.id.toString()}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ing-expiry">Expiry Date (optional)</Label>
        <Input
          id="ing-expiry"
          type="date"
          value={form.expiryDate}
          onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Inventory</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your ingredient stock levels</p>
        </div>
        <Button onClick={openAdd} className="gap-2 self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          Add Ingredient
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search ingredients..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead
                className="cursor-pointer select-none hover:text-foreground"
                onClick={() => toggleSort('name')}
              >
                Name {sortField === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </TableHead>
              <TableHead
                className="cursor-pointer select-none hover:text-foreground"
                onClick={() => toggleSort('quantity')}
              >
                Quantity {sortField === 'quantity' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </TableHead>
              <TableHead>Unit</TableHead>
              <TableHead
                className="cursor-pointer select-none hover:text-foreground"
                onClick={() => toggleSort('costPrice')}
              >
                Cost Price {sortField === 'costPrice' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </TableHead>
              <TableHead>Total Value</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-destructive py-8">
                  Failed to load inventory
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-12">
                  {search ? 'No ingredients match your search' : 'No ingredients yet. Add your first ingredient!'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(ingredient => {
                const isLowStock = ingredient.quantity <= ingredient.lowStockThreshold;
                const expiringSoon = isExpiringSoon(ingredient.expiryDate);
                return (
                  <TableRow key={ingredient.id.toString()} className={`hover:bg-muted/30 ${isLowStock ? 'bg-destructive/5' : ''}`}>
                    <TableCell className="font-medium">{ingredient.name}</TableCell>
                    <TableCell className={isLowStock ? 'text-destructive font-semibold' : ''}>
                      {ingredient.quantity}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{ingredient.unit}</TableCell>
                    <TableCell>₹{ingredient.costPrice.toFixed(2)}</TableCell>
                    <TableCell>₹{(ingredient.quantity * ingredient.costPrice).toFixed(2)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{getSupplierName(ingredient.supplierId)}</TableCell>
                    <TableCell>
                      {ingredient.expiryDate ? (
                        <span className={`text-sm flex items-center gap-1 ${expiringSoon ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                          {expiringSoon && <Calendar className="h-3.5 w-3.5" />}
                          {formatExpiryDate(ingredient.expiryDate)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isLowStock ? (
                        <Badge variant="destructive" className="gap-1 text-xs">
                          <AlertTriangle className="h-3 w-3" />
                          Low Stock
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">OK</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(ingredient)}
                          className="h-8 w-8"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(ingredient.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            {search ? 'No ingredients match your search' : 'No ingredients yet.'}
          </div>
        ) : (
          filtered.map(ingredient => {
            const isLowStock = ingredient.quantity <= ingredient.lowStockThreshold;
            const expiringSoon = isExpiringSoon(ingredient.expiryDate);
            return (
              <div
                key={ingredient.id.toString()}
                className={`rounded-xl border bg-card p-4 space-y-2 ${isLowStock ? 'border-destructive/50 bg-destructive/5' : 'border-border'}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{ingredient.name}</p>
                    <p className="text-sm text-muted-foreground">{ingredient.unit}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(ingredient)} className="h-8 w-8">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(ingredient.id)} className="h-8 w-8 text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Qty: </span>
                    <span className={isLowStock ? 'text-destructive font-semibold' : ''}>{ingredient.quantity}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cost: </span>
                    <span>₹{ingredient.costPrice.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Supplier: </span>
                    <span>{getSupplierName(ingredient.supplierId)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Expiry: </span>
                    <span className={expiringSoon ? 'text-destructive font-bold' : ''}>
                      {formatExpiryDate(ingredient.expiryDate)}
                    </span>
                  </div>
                </div>
                {isLowStock && (
                  <Badge variant="destructive" className="gap-1 text-xs">
                    <AlertTriangle className="h-3 w-3" />
                    Low Stock
                  </Badge>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Ingredient</DialogTitle>
            <DialogDescription>Fill in the ingredient details below.</DialogDescription>
          </DialogHeader>
          <IngredientFormFields />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAddSubmit} disabled={createIngredient.isPending}>
              {createIngredient.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Add Ingredient
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editIngredient} onOpenChange={open => !open && setEditIngredient(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Ingredient</DialogTitle>
            <DialogDescription>Update the ingredient details below.</DialogDescription>
          </DialogHeader>
          <IngredientFormFields />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditIngredient(null)}>Cancel</Button>
            <Button onClick={handleEditSubmit} disabled={updateIngredient.isPending}>
              {updateIngredient.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ingredient</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this ingredient? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteIngredient.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
