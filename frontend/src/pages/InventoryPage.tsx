import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useListInventory, useDeleteInventoryItem } from '../hooks/useQueries';
import type { InventoryResponse } from '../backend';
import {
  Plus, Search, Pencil, Trash2, AlertTriangle, Package, RefreshCw, ChevronUp, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import AddIngredientForm from '../components/AddIngredientForm';
import EditIngredientForm from '../components/EditIngredientForm';
import { cn } from '@/lib/utils';

type SortField = 'name' | 'quantity' | 'costPricePerUnit' | 'totalValue';
type SortDir = 'asc' | 'desc';

export default function InventoryPage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryResponse | null>(null);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const { data: inventory, isLoading, error, refetch } = useListInventory();
  const deleteMutation = useDeleteInventoryItem();

  useEffect(() => {
    if (!identity) {
      navigate({ to: '/login' });
    }
  }, [identity, navigate]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const filtered = (inventory ?? [])
    .filter(item =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.supplier.toLowerCase().includes(search.toLowerCase()) ||
      item.unit.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const mult = sortDir === 'asc' ? 1 : -1;
      if (sortField === 'name') return mult * a.name.localeCompare(b.name);
      return mult * (a[sortField] - b[sortField]);
    });

  const isLowStock = (item: InventoryResponse) => item.quantity <= item.lowStockThreshold;

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUp className="w-3 h-3 opacity-30" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-primary" />
      : <ChevronDown className="w-3 h-3 text-primary" />;
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Inventory</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage your kitchen ingredients and stock levels
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="flex items-center gap-2 border-border hover:bg-accent"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-green"
              >
                <Plus className="w-4 h-4" />
                Add Ingredient
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-heading">Add New Ingredient</DialogTitle>
              </DialogHeader>
              <AddIngredientForm onSuccess={() => setAddOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search ingredients..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 bg-card border-border"
          />
        </div>
        {!isLoading && inventory && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{filtered.length} of {inventory.length} items</span>
            {filtered.some(isLowStock) && (
              <Badge variant="destructive" className="text-xs gap-1">
                <AlertTriangle className="w-3 h-3" />
                {filtered.filter(isLowStock).length} low stock
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          Failed to load inventory. You may not have admin access.
        </div>
      )}

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {[
                  { label: 'Name', field: 'name' as SortField },
                  { label: 'Quantity', field: 'quantity' as SortField },
                  { label: 'Unit', field: null },
                  { label: 'Cost/Unit', field: 'costPricePerUnit' as SortField },
                  { label: 'Total Value', field: 'totalValue' as SortField },
                  { label: 'Supplier', field: null },
                  { label: 'Threshold', field: null },
                  { label: 'Status', field: null },
                  { label: 'Actions', field: null },
                ].map(({ label, field }) => (
                  <th
                    key={label}
                    className={cn(
                      'px-4 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wide',
                      field && 'cursor-pointer hover:text-foreground select-none'
                    )}
                    onClick={() => field && handleSort(field)}
                  >
                    <div className="flex items-center gap-1">
                      {label}
                      {field && <SortIcon field={field} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                        <Package className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">No ingredients found</p>
                        <p className="text-muted-foreground text-xs mt-1">
                          {search ? 'Try a different search term' : 'Add your first ingredient to get started'}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item.name}
                    className={cn(
                      'border-b border-border last:border-0 hover:bg-muted/30 transition-colors',
                      isLowStock(item) && 'bg-warning/5 hover:bg-warning/10'
                    )}
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        {isLowStock(item) && <div className="w-1.5 h-1.5 rounded-full bg-warning flex-shrink-0" />}
                        {item.name}
                      </div>
                    </td>
                    <td className={cn('px-4 py-3 font-semibold', isLowStock(item) ? 'text-warning' : 'text-foreground')}>
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{item.unit}</td>
                    <td className="px-4 py-3 text-foreground">{formatCurrency(item.costPricePerUnit)}</td>
                    <td className="px-4 py-3 font-semibold text-primary">{formatCurrency(item.totalValue)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.supplier || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.lowStockThreshold} {item.unit}</td>
                    <td className="px-4 py-3">
                      {isLowStock(item) ? (
                        <Badge variant="destructive" className="text-xs gap-1 whitespace-nowrap">
                          <AlertTriangle className="w-3 h-3" />
                          Low Stock
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs text-primary bg-secondary">
                          In Stock
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Dialog
                          open={editItem?.name === item.name}
                          onOpenChange={(open) => !open && setEditItem(null)}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-secondary"
                              onClick={() => setEditItem(item)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                              <DialogTitle className="font-heading">Edit Ingredient</DialogTitle>
                            </DialogHeader>
                            {editItem && (
                              <EditIngredientForm
                                item={editItem}
                                onSuccess={() => setEditItem(null)}
                                onCancel={() => setEditItem(null)}
                              />
                            )}
                          </DialogContent>
                        </Dialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Ingredient</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete <strong>{item.name}</strong>? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(item.name)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-border">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">No ingredients found</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    {search ? 'Try a different search term' : 'Add your first ingredient to get started'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.name}
                className={cn(
                  'p-4 hover:bg-muted/30 transition-colors',
                  isLowStock(item) && 'bg-warning/5'
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {isLowStock(item) && <div className="w-2 h-2 rounded-full bg-warning flex-shrink-0 mt-1" />}
                    <h3 className="font-semibold text-foreground truncate">{item.name}</h3>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {isLowStock(item) ? (
                      <Badge variant="destructive" className="text-xs">Low Stock</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs text-primary bg-secondary">In Stock</Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-3">
                  <div>
                    <span className="text-muted-foreground text-xs">Quantity</span>
                    <p className={cn('font-semibold', isLowStock(item) ? 'text-warning' : 'text-foreground')}>
                      {item.quantity} {item.unit}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Total Value</span>
                    <p className="font-semibold text-primary">{formatCurrency(item.totalValue)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Cost/Unit</span>
                    <p className="text-foreground">{formatCurrency(item.costPricePerUnit)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Threshold</span>
                    <p className="text-foreground">{item.lowStockThreshold} {item.unit}</p>
                  </div>
                  {item.supplier && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground text-xs">Supplier</span>
                      <p className="text-foreground">{item.supplier}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Dialog
                    open={editItem?.name === item.name}
                    onOpenChange={(open) => !open && setEditItem(null)}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs border-border hover:bg-secondary hover:text-primary"
                        onClick={() => setEditItem(item)}
                      >
                        <Pencil className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle className="font-heading">Edit Ingredient</DialogTitle>
                      </DialogHeader>
                      {editItem && (
                        <EditIngredientForm
                          item={editItem}
                          onSuccess={() => setEditItem(null)}
                          onCancel={() => setEditItem(null)}
                        />
                      )}
                    </DialogContent>
                  </Dialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Ingredient</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete <strong>{item.name}</strong>? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(item.name)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
