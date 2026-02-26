import { useState } from 'react';
import { useUpdateIngredient, useSuppliers } from '../hooks/useQueries';
import type { Ingredient, UpdateIngredientRequest } from '../backend';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';

interface EditIngredientFormProps {
  item: Ingredient;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormState {
  name: string;
  quantity: string;
  unit: string;
  costPrice: string;
  lowStockThreshold: string;
  supplierId: string;
  expiryDate: string;
}

export default function EditIngredientForm({ item, onSuccess, onCancel }: EditIngredientFormProps) {
  const [form, setForm] = useState<FormState>({
    name: item.name,
    quantity: item.quantity.toString(),
    unit: item.unit,
    costPrice: item.costPrice.toString(),
    lowStockThreshold: item.lowStockThreshold.toString(),
    supplierId: item.supplierId ? item.supplierId.toString() : '',
    expiryDate: item.expiryDate
      ? format(new Date(Number(item.expiryDate) / 1_000_000), 'yyyy-MM-dd')
      : '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [success, setSuccess] = useState(false);

  const updateMutation = useUpdateIngredient();
  const { data: suppliers } = useSuppliers();

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.quantity || isNaN(Number(form.quantity)) || Number(form.quantity) < 0)
      newErrors.quantity = 'Valid quantity is required';
    if (!form.unit.trim()) newErrors.unit = 'Unit is required';
    if (!form.costPrice || isNaN(Number(form.costPrice)) || Number(form.costPrice) < 0)
      newErrors.costPrice = 'Valid cost price is required';
    if (!form.lowStockThreshold || isNaN(Number(form.lowStockThreshold)) || Number(form.lowStockThreshold) < 0)
      newErrors.lowStockThreshold = 'Valid threshold is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: UpdateIngredientRequest = {
      name: form.name.trim(),
      quantity: Number(form.quantity),
      unit: form.unit.trim(),
      costPrice: Number(form.costPrice),
      lowStockThreshold: Number(form.lowStockThreshold),
      supplierId: form.supplierId ? BigInt(form.supplierId) : undefined,
      expiryDate: form.expiryDate
        ? BigInt(new Date(form.expiryDate).getTime() * 1_000_000)
        : undefined,
    };

    try {
      await updateMutation.mutateAsync({ id: item.id, item: payload });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSuccess();
      }, 800);
    } catch (err) {
      console.error('Failed to update ingredient:', err);
    }
  };

  const set = (field: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const totalValue = Number(form.quantity) * Number(form.costPrice);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {updateMutation.isError && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          Failed to update ingredient. Please try again.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Name */}
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="edit-name" className="text-sm font-medium">
            Ingredient Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="edit-name"
            placeholder="e.g. Romaine Lettuce"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            className={errors.name ? 'border-destructive' : 'border-border'}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>

        {/* Quantity */}
        <div className="space-y-1.5">
          <Label htmlFor="edit-quantity" className="text-sm font-medium">
            Quantity <span className="text-destructive">*</span>
          </Label>
          <Input
            id="edit-quantity"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={form.quantity}
            onChange={e => set('quantity', e.target.value)}
            className={errors.quantity ? 'border-destructive' : 'border-border'}
          />
          {errors.quantity && <p className="text-xs text-destructive">{errors.quantity}</p>}
        </div>

        {/* Unit */}
        <div className="space-y-1.5">
          <Label htmlFor="edit-unit" className="text-sm font-medium">
            Unit <span className="text-destructive">*</span>
          </Label>
          <Input
            id="edit-unit"
            placeholder="e.g. kg, liters, pieces"
            value={form.unit}
            onChange={e => set('unit', e.target.value)}
            className={errors.unit ? 'border-destructive' : 'border-border'}
          />
          {errors.unit && <p className="text-xs text-destructive">{errors.unit}</p>}
        </div>

        {/* Cost Price */}
        <div className="space-y-1.5">
          <Label htmlFor="edit-costPrice" className="text-sm font-medium">
            Cost Price per Unit <span className="text-destructive">*</span>
          </Label>
          <Input
            id="edit-costPrice"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={form.costPrice}
            onChange={e => set('costPrice', e.target.value)}
            className={errors.costPrice ? 'border-destructive' : 'border-border'}
          />
          {errors.costPrice && <p className="text-xs text-destructive">{errors.costPrice}</p>}
        </div>

        {/* Low Stock Threshold */}
        <div className="space-y-1.5">
          <Label htmlFor="edit-threshold" className="text-sm font-medium">
            Low Stock Threshold <span className="text-destructive">*</span>
          </Label>
          <Input
            id="edit-threshold"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={form.lowStockThreshold}
            onChange={e => set('lowStockThreshold', e.target.value)}
            className={errors.lowStockThreshold ? 'border-destructive' : 'border-border'}
          />
          {errors.lowStockThreshold && <p className="text-xs text-destructive">{errors.lowStockThreshold}</p>}
        </div>

        {/* Supplier */}
        <div className="sm:col-span-2 space-y-1.5">
          <Label className="text-sm font-medium">Supplier (optional)</Label>
          <Select
            value={form.supplierId}
            onValueChange={val => set('supplierId', val === 'none' ? '' : val)}
          >
            <SelectTrigger>
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

        {/* Expiry Date */}
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="edit-expiry" className="text-sm font-medium">Expiry Date (optional)</Label>
          <Input
            id="edit-expiry"
            type="date"
            value={form.expiryDate}
            onChange={e => set('expiryDate', e.target.value)}
            className="border-border"
          />
        </div>
      </div>

      {/* Total Value Preview */}
      <div className="p-3 rounded-xl bg-secondary border border-border">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Calculated Total Value</span>
          <span className="font-semibold text-primary">
            ₹{isNaN(totalValue) ? '0.00' : totalValue.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1 border-border hover:bg-accent"
          onClick={onCancel}
          disabled={updateMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={updateMutation.isPending || success}
        >
          {success ? (
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Saved!
            </span>
          ) : updateMutation.isPending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </span>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </form>
  );
}
