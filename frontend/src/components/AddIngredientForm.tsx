import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateIngredient, useSuppliers, CreateIngredientRequest } from '../hooks/useQueries';

interface AddIngredientFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function AddIngredientForm({ onSuccess, onCancel }: AddIngredientFormProps) {
  const createIngredient = useCreateIngredient();
  const { data: suppliers = [] } = useSuppliers();

  const [form, setForm] = useState<Omit<CreateIngredientRequest, 'id'>>({
    name: '',
    quantity: 0,
    unit: '',
    minStockLevel: 0,
    costPerUnit: 0,
    supplierId: undefined,
    expiryDate: undefined,
  });

  const [expiryDateStr, setExpiryDateStr] = useState('');

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createIngredient.mutateAsync({
      ...form,
      expiryDate: expiryDateStr ? new Date(expiryDateStr).getTime() : undefined,
    });
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={form.name}
          onChange={e => update('name', e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            min={0}
            value={form.quantity}
            onChange={e => update('quantity', Number(e.target.value))}
          />
        </div>
        <div>
          <Label htmlFor="unit">Unit</Label>
          <Input
            id="unit"
            value={form.unit}
            onChange={e => update('unit', e.target.value)}
            placeholder="kg, L, pcs..."
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="costPerUnit">Cost Per Unit (₹)</Label>
          <Input
            id="costPerUnit"
            type="number"
            min={0}
            step="0.01"
            value={form.costPerUnit}
            onChange={e => update('costPerUnit', Number(e.target.value))}
          />
        </div>
        <div>
          <Label htmlFor="minStockLevel">Min Stock Level</Label>
          <Input
            id="minStockLevel"
            type="number"
            min={0}
            value={form.minStockLevel}
            onChange={e => update('minStockLevel', Number(e.target.value))}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="supplier">Supplier (optional)</Label>
        <Select
          value={form.supplierId?.toString() ?? ''}
          onValueChange={val => update('supplierId', val ? Number(val) : undefined)}
        >
          <SelectTrigger id="supplier">
            <SelectValue placeholder="Select supplier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">None</SelectItem>
            {suppliers.map(s => (
              <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="expiryDate">Expiry Date (optional)</Label>
        <Input
          id="expiryDate"
          type="date"
          value={expiryDateStr}
          onChange={e => setExpiryDateStr(e.target.value)}
        />
      </div>

      <div className="flex gap-2 justify-end pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={createIngredient.isPending}>
          {createIngredient.isPending ? 'Adding...' : 'Add Ingredient'}
        </Button>
      </div>
    </form>
  );
}
