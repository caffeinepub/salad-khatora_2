import { useState } from 'react';
import { useAddInventoryItem } from '../hooks/useQueries';
import type { InventoryItem } from '../backend';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddIngredientFormProps {
  onSuccess: () => void;
}

const defaultForm: InventoryItem = {
  name: '',
  quantity: 0,
  unit: '',
  costPricePerUnit: 0,
  supplier: '',
  lowStockThreshold: 0,
};

export default function AddIngredientForm({ onSuccess }: AddIngredientFormProps) {
  const [form, setForm] = useState<InventoryItem>(defaultForm);
  const [errors, setErrors] = useState<Partial<Record<keyof InventoryItem, string>>>({});
  const [success, setSuccess] = useState(false);

  const addMutation = useAddInventoryItem();

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof InventoryItem, string>> = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (form.quantity < 0) newErrors.quantity = 'Quantity must be non-negative';
    if (!form.unit.trim()) newErrors.unit = 'Unit is required';
    if (form.costPricePerUnit < 0) newErrors.costPricePerUnit = 'Cost price must be non-negative';
    if (form.lowStockThreshold < 0) newErrors.lowStockThreshold = 'Threshold must be non-negative';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await addMutation.mutateAsync(form);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSuccess();
      }, 800);
    } catch (err) {
      console.error('Failed to add ingredient:', err);
    }
  };

  const handleChange = (field: keyof InventoryItem, value: string) => {
    const numFields: (keyof InventoryItem)[] = ['quantity', 'costPricePerUnit', 'lowStockThreshold'];
    setForm(prev => ({
      ...prev,
      [field]: numFields.includes(field) ? parseFloat(value) || 0 : value,
    }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const totalValue = form.quantity * form.costPricePerUnit;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {addMutation.isError && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          Failed to add ingredient. Please try again.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Name */}
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="name" className="text-sm font-medium">
            Ingredient Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            placeholder="e.g. Romaine Lettuce"
            value={form.name}
            onChange={e => handleChange('name', e.target.value)}
            className={errors.name ? 'border-destructive' : 'border-border'}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>

        {/* Quantity */}
        <div className="space-y-1.5">
          <Label htmlFor="quantity" className="text-sm font-medium">
            Quantity <span className="text-destructive">*</span>
          </Label>
          <Input
            id="quantity"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={form.quantity || ''}
            onChange={e => handleChange('quantity', e.target.value)}
            className={errors.quantity ? 'border-destructive' : 'border-border'}
          />
          {errors.quantity && <p className="text-xs text-destructive">{errors.quantity}</p>}
        </div>

        {/* Unit */}
        <div className="space-y-1.5">
          <Label htmlFor="unit" className="text-sm font-medium">
            Unit <span className="text-destructive">*</span>
          </Label>
          <Input
            id="unit"
            placeholder="e.g. kg, liters, pieces"
            value={form.unit}
            onChange={e => handleChange('unit', e.target.value)}
            className={errors.unit ? 'border-destructive' : 'border-border'}
          />
          {errors.unit && <p className="text-xs text-destructive">{errors.unit}</p>}
        </div>

        {/* Cost Price */}
        <div className="space-y-1.5">
          <Label htmlFor="costPricePerUnit" className="text-sm font-medium">
            Cost Price per Unit ($) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="costPricePerUnit"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={form.costPricePerUnit || ''}
            onChange={e => handleChange('costPricePerUnit', e.target.value)}
            className={errors.costPricePerUnit ? 'border-destructive' : 'border-border'}
          />
          {errors.costPricePerUnit && <p className="text-xs text-destructive">{errors.costPricePerUnit}</p>}
        </div>

        {/* Low Stock Threshold */}
        <div className="space-y-1.5">
          <Label htmlFor="lowStockThreshold" className="text-sm font-medium">
            Low Stock Threshold
          </Label>
          <Input
            id="lowStockThreshold"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={form.lowStockThreshold || ''}
            onChange={e => handleChange('lowStockThreshold', e.target.value)}
            className={errors.lowStockThreshold ? 'border-destructive' : 'border-border'}
          />
          {errors.lowStockThreshold && <p className="text-xs text-destructive">{errors.lowStockThreshold}</p>}
        </div>

        {/* Supplier */}
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="supplier" className="text-sm font-medium">Supplier</Label>
          <Input
            id="supplier"
            placeholder="e.g. Fresh Farms Co."
            value={form.supplier}
            onChange={e => handleChange('supplier', e.target.value)}
            className="border-border"
          />
        </div>
      </div>

      {/* Total Value Preview */}
      {(form.quantity > 0 || form.costPricePerUnit > 0) && (
        <div className="p-3 rounded-xl bg-secondary border border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Calculated Total Value</span>
            <span className="font-semibold text-primary">
              ${totalValue.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1 border-border hover:bg-accent"
          onClick={onSuccess}
          disabled={addMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-green"
          disabled={addMutation.isPending || success}
        >
          {success ? (
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Added!
            </span>
          ) : addMutation.isPending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Adding...
            </span>
          ) : (
            'Add Ingredient'
          )}
        </Button>
      </div>
    </form>
  );
}
