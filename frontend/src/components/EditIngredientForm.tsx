import React, { useState } from 'react';
import { useUpdateIngredient, useSuppliers, Ingredient, UpdateIngredientRequest } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface EditIngredientFormProps {
  ingredient: Ingredient;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function EditIngredientForm({ ingredient, onSuccess, onCancel }: EditIngredientFormProps) {
  const updateIngredient = useUpdateIngredient();
  const { data: suppliers = [] } = useSuppliers();

  const [form, setForm] = useState<UpdateIngredientRequest>({
    name: ingredient.name,
    quantity: ingredient.quantity,
    unit: ingredient.unit,
    costPrice: ingredient.costPrice,
    supplierId: ingredient.supplierId,
    lowStockThreshold: ingredient.lowStockThreshold,
    expiryDate: ingredient.expiryDate,
  });

  const [expiryDateStr, setExpiryDateStr] = useState(
    ingredient.expiryDate ? new Date(ingredient.expiryDate).toISOString().split('T')[0] : ''
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: UpdateIngredientRequest = {
      ...form,
      expiryDate: expiryDateStr ? new Date(expiryDateStr).getTime() : undefined,
    };
    await updateIngredient.mutateAsync({ id: ingredient.id, item: payload });
    onSuccess();
  };

  return (
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
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="quantity">Quantity *</Label>
          <Input
            id="quantity"
            type="number"
            min={0}
            step="0.01"
            value={form.quantity}
            onChange={e => setForm(f => ({ ...f, quantity: parseFloat(e.target.value) || 0 }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="unit">Unit *</Label>
          <Input
            id="unit"
            value={form.unit}
            onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="costPrice">Cost Price *</Label>
          <Input
            id="costPrice"
            type="number"
            min={0}
            step="0.01"
            value={form.costPrice}
            onChange={e => setForm(f => ({ ...f, costPrice: parseFloat(e.target.value) || 0 }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="lowStockThreshold">Low Stock Threshold *</Label>
          <Input
            id="lowStockThreshold"
            type="number"
            min={0}
            step="0.01"
            value={form.lowStockThreshold}
            onChange={e => setForm(f => ({ ...f, lowStockThreshold: parseFloat(e.target.value) || 0 }))}
            required
          />
        </div>
      </div>
      <div>
        <Label htmlFor="supplier">Supplier</Label>
        <Select
          value={form.supplierId?.toString() ?? ''}
          onValueChange={val => setForm(f => ({ ...f, supplierId: val ? parseInt(val) : undefined }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select supplier (optional)" />
          </SelectTrigger>
          <SelectContent>
            {suppliers.map(s => (
              <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="expiryDate">Expiry Date</Label>
        <Input
          id="expiryDate"
          type="date"
          value={expiryDateStr}
          onChange={e => setExpiryDateStr(e.target.value)}
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={updateIngredient.isPending}>
          {updateIngredient.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </form>
  );
}
