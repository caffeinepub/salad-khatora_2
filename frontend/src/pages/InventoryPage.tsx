import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { useIngredients, useDeleteIngredient, Ingredient } from '../hooks/useQueries';
import AddIngredientForm from '../components/AddIngredientForm';
import EditIngredientForm from '../components/EditIngredientForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

function formatCurrency(amount: number) {
  return `₹${amount.toFixed(2)}`;
}

function isExpiringSoon(expiryDate?: number): boolean {
  if (!expiryDate) return false;
  return expiryDate - Date.now() <= 7 * 86400000;
}

export default function InventoryPage() {
  const { data: ingredients = [], isLoading } = useIngredients();
  const deleteIngredient = useDeleteIngredient();

  const [search, setSearch] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filtered = ingredients.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleDelete() {
    if (deletingId !== null) {
      await deleteIngredient.mutateAsync(deletingId);
      setDeletingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-12 bg-muted rounded" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
          <p className="text-muted-foreground">Manage ingredients and stock levels.</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Ingredient
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search ingredients..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">
              {search ? 'No ingredients match your search.' : 'No ingredients yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Cost/Unit</TableHead>
                  <TableHead>Min Stock</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(ingredient => {
                  const threshold = ingredient.minStockLevel ?? 0;
                  const isLow = ingredient.quantity <= threshold;
                  const expiringSoon = isExpiringSoon(ingredient.expiryDate);

                  return (
                    <TableRow key={ingredient.id}>
                      <TableCell className="font-medium">{ingredient.name}</TableCell>
                      <TableCell className={isLow ? 'text-destructive font-medium' : ''}>
                        {ingredient.quantity}
                      </TableCell>
                      <TableCell>{ingredient.unit}</TableCell>
                      <TableCell>{formatCurrency(ingredient.costPerUnit)}</TableCell>
                      <TableCell>{threshold}</TableCell>
                      <TableCell className={expiringSoon ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                        {ingredient.expiryDate
                          ? new Date(ingredient.expiryDate).toLocaleDateString()
                          : '—'}
                      </TableCell>
                      <TableCell>
                        {isLow && <Badge variant="destructive" className="text-xs">Low Stock</Badge>}
                        {expiringSoon && !isLow && <Badge variant="outline" className="text-xs text-destructive border-destructive">Expiring</Badge>}
                        {!isLow && !expiringSoon && <Badge variant="secondary" className="text-xs">OK</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setEditingIngredient(ingredient)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => setDeletingId(ingredient.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map(ingredient => {
              const threshold = ingredient.minStockLevel ?? 0;
              const isLow = ingredient.quantity <= threshold;
              const expiringSoon = isExpiringSoon(ingredient.expiryDate);

              return (
                <Card key={ingredient.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{ingredient.name}</span>
                          {isLow && <Badge variant="destructive" className="text-xs">Low Stock</Badge>}
                          {expiringSoon && <AlertTriangle className="h-4 w-4 text-destructive" />}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {ingredient.quantity} {ingredient.unit} · {formatCurrency(ingredient.costPerUnit)}/unit
                        </p>
                        {ingredient.expiryDate && (
                          <p className={`text-xs mt-0.5 ${expiringSoon ? 'text-destructive' : 'text-muted-foreground'}`}>
                            Expires: {new Date(ingredient.expiryDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingIngredient(ingredient)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setDeletingId(ingredient.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Add Dialog */}
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

      {/* Edit Dialog */}
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

      {/* Delete Confirmation */}
      <AlertDialog open={deletingId !== null} onOpenChange={open => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ingredient?</AlertDialogTitle>
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
