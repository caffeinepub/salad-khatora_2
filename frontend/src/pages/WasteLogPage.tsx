import { useState } from 'react';
import { Trash2, TrendingDown, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useIngredients, useWasteLogs, useCreateWasteLog, useWasteStats } from '../hooks/useQueries';

const WASTE_REASONS = ['spoiled', 'overcooked', 'dropped', 'other'];

export default function WasteLogPage() {
  const { data: ingredients, isLoading: ingredientsLoading } = useIngredients();
  const { data: wasteLogs, isLoading: logsLoading } = useWasteLogs();
  // useWasteStats returns a plain object (not a query), so destructure directly
  const wasteStats = useWasteStats();
  const createWasteLog = useCreateWasteLog();

  const [selectedIngredientId, setSelectedIngredientId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  const selectedIngredient = ingredients?.find(i => i.id.toString() === selectedIngredientId);
  // Use costPerUnit (the required field) for cost estimation
  const estimatedCostLoss = selectedIngredient && quantity && !isNaN(Number(quantity))
    ? selectedIngredient.costPerUnit * Number(quantity)
    : null;

  const handleSubmit = async () => {
    setFormError(null);
    if (!selectedIngredientId) { setFormError('Please select an ingredient'); return; }
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      setFormError('Please enter a valid quantity greater than 0'); return;
    }
    if (!reason) { setFormError('Please select a reason'); return; }

    try {
      await createWasteLog.mutateAsync({
        ingredientId: parseInt(selectedIngredientId),
        quantity: Number(quantity),
        reason,
      });
      toast.success('Waste log recorded successfully');
      setSelectedIngredientId('');
      setQuantity('');
      setReason('');
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to record waste log');
    }
  };

  // Sort by createdAt (the field in WasteLog type)
  const sortedLogs = [...(wasteLogs ?? [])].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Waste & Spoilage Log</h1>
        <p className="text-muted-foreground text-sm mt-1">Track ingredient waste and analyze spoilage costs</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
              Total Cost Loss
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">
              ₹{wasteStats.totalCostLoss.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-muted-foreground" />
              Total Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {wasteStats.count}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Log Waste Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-heading font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            Log Waste
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {formError && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{formError}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Ingredient Selector */}
            <div className="space-y-1">
              <Label>Ingredient</Label>
              {ingredientsLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={selectedIngredientId} onValueChange={setSelectedIngredientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ingredient..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(ingredients ?? []).map(ing => (
                      <SelectItem key={ing.id} value={ing.id.toString()}>
                        {ing.name} ({ing.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Quantity */}
            <div className="space-y-1">
              <Label htmlFor="waste-qty">
                Quantity {selectedIngredient ? `(${selectedIngredient.unit})` : ''}
              </Label>
              <Input
                id="waste-qty"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
              />
              {estimatedCostLoss !== null && (
                <p className="text-xs text-muted-foreground">
                  Est. cost loss: ₹{estimatedCostLoss.toFixed(2)}
                </p>
              )}
            </div>

            {/* Reason */}
            <div className="space-y-1">
              <Label>Reason</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason..." />
                </SelectTrigger>
                <SelectContent>
                  {WASTE_REASONS.map(r => (
                    <SelectItem key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={createWasteLog.isPending}
            className="w-full sm:w-auto"
          >
            {createWasteLog.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Record Waste
          </Button>
        </CardContent>
      </Card>

      {/* Waste Log Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-heading font-semibold">Waste History</CardTitle>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : sortedLogs.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No waste logs recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingredient</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Cost Loss</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedLogs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.ingredientName}</TableCell>
                      <TableCell>{log.quantity} {log.unit}</TableCell>
                      <TableCell className="capitalize">{log.reason}</TableCell>
                      <TableCell className="text-destructive font-medium">₹{log.costLoss.toFixed(2)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
