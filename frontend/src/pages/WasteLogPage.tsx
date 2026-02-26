import { useState } from 'react';
import { format } from 'date-fns';
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
  const { data: wasteStats, isLoading: statsLoading } = useWasteStats();
  const createWasteLog = useCreateWasteLog();

  const [selectedIngredientId, setSelectedIngredientId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  const selectedIngredient = ingredients?.find(i => i.id.toString() === selectedIngredientId);
  const estimatedCostLoss = selectedIngredient && quantity && !isNaN(Number(quantity))
    ? selectedIngredient.costPrice * Number(quantity)
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
        ingredientId: BigInt(selectedIngredientId),
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

  const sortedLogs = [...(wasteLogs ?? [])].sort((a, b) =>
    Number(b.loggedAt) - Number(a.loggedAt)
  );

  return (
    <div className="space-y-6">
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
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold text-destructive">
                ₹{(wasteStats?.totalWasteCost ?? 0).toFixed(2)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Total Waste Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold text-foreground">
                {wasteStats?.totalWasteCount?.toString() ?? '0'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Log Waste Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trash2 className="h-4 w-4 text-destructive" />
              Log Waste
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formError && (
              <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{formError}</p>
            )}

            <div className="space-y-1.5">
              <Label>Ingredient *</Label>
              {ingredientsLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={selectedIngredientId} onValueChange={setSelectedIngredientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ingredient..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(ingredients ?? []).map(ing => (
                      <SelectItem key={ing.id.toString()} value={ing.id.toString()}>
                        {ing.name} ({ing.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {selectedIngredient && (
              <div className="text-xs text-muted-foreground bg-muted px-3 py-2 rounded-md">
                Unit: <span className="font-medium">{selectedIngredient.unit}</span> &nbsp;|&nbsp;
                In stock: <span className="font-medium">{selectedIngredient.quantity}</span> &nbsp;|&nbsp;
                Cost: <span className="font-medium">₹{selectedIngredient.costPrice}/{selectedIngredient.unit}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="0.01"
                step="0.01"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                placeholder="Enter quantity"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Reason *</Label>
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

            {estimatedCostLoss !== null && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                <p className="text-sm text-destructive font-medium">
                  Estimated Cost Loss: ₹{estimatedCostLoss.toFixed(2)}
                </p>
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={createWasteLog.isPending}
              className="w-full"
              variant="destructive"
            >
              {createWasteLog.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Record Waste
            </Button>
          </CardContent>
        </Card>

        {/* Waste History Table */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-lg font-heading font-semibold text-foreground">Waste History</h2>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Ingredient</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Cost Loss</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logsLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : sortedLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                      <div className="flex flex-col items-center gap-2">
                        <Trash2 className="h-8 w-8 opacity-30" />
                        <p>No waste logs yet.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedLogs.map(log => (
                    <TableRow key={log.id.toString()} className="hover:bg-muted/30">
                      <TableCell className="font-medium">{log.ingredientName}</TableCell>
                      <TableCell>
                        {log.quantity} <span className="text-muted-foreground text-xs">{log.unit}</span>
                      </TableCell>
                      <TableCell>
                        <span className="capitalize text-sm">{log.reason}</span>
                      </TableCell>
                      <TableCell className="text-destructive font-medium">
                        ₹{log.costLoss.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(Number(log.loggedAt) / 1_000_000), 'MMM d, yyyy HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
