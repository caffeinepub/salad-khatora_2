import React, { useState } from 'react';
import {
  useIngredients,
  useDeleteIngredient,
} from '../hooks/useQueries';
import type { Ingredient } from '../hooks/useQueries';
import AddIngredientForm from '../components/AddIngredientForm';
import EditIngredientForm from '../components/EditIngredientForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function InventoryPage() {
  const { data: ingredients = [], isLoading } = useIngredients();
  const deleteIngredient = useDeleteIngredient();

  const [search, setSearch] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);

  const filtered = ingredients.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  const isExpiringSoon = (expiryDate?: number) => {
    if (!expiryDate) return false;
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    return expiryDate - Date.now() <= sevenDays && expiryDate > Date.now();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your ingredients and stock levels</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Ingredient
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search ingredients..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {search ? 'No ingredients match your search.' : 'No ingredients yet. Add your first one!'}
          </p>
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead className="hidden md:table-cell">Cost/Unit</TableHead>
                <TableHead className="hidden lg:table-cell">Supplier</TableHead>
                <TableHead className="hidden lg:table-cell">Expiry</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(ingredient => (
                <TableRow key={ingredient.id}>
                  <TableCell className="font-medium">{ingredient.name}</TableCell>
                  <TableCell>
                    {ingredient.quantity} {ingredient.unit}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    ${ingredient.costPrice.toFixed(2)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {ingredient.supplierId ? `Supplier #${ingredient.supplierId}` : '—'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {ingredient.expiryDate ? (
                      <span className={isExpiringSoon(ingredient.expiryDate) ? 'text-red-600 font-medium' : ''}>
                        {new Date(ingredient.expiryDate).toLocaleDateString()}
                      </span>
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    {ingredient.quantity <= ingredient.lowStockThreshold ? (
                      <Badge variant="destructive">Low Stock</Badge>
                    ) : (
                      <Badge variant="outline" className="text-green-600 border-green-300">OK</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingIngredient(ingredient)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Ingredient</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{ingredient.name}"?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteIngredient.mutate(ingredient.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Ingredient</DialogTitle>
          </DialogHeader>
          <AddIngredientForm
            onSuccess={() => setShowAddDialog(false)}
            onCancel={() => setShowAddDialog(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingIngredient} onOpenChange={open => !open && setEditingIngredient(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Ingredient</DialogTitle>
          </DialogHeader>
          {editingIngredient && (
            <EditIngredientForm
              ingredient={editingIngredient}
              onSuccess={() => setEditingIngredient(null)}
              onCancel={() => setEditingIngredient(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
