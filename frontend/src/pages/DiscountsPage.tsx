import { useState } from 'react';
import { Tag, Plus, Edit, Trash2, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DiscountCode, DiscountCodeInput, DiscountType } from '../backend';
import {
  useDiscountCodes,
  useCreateDiscountCode,
  useUpdateDiscountCode,
  useDeleteDiscountCode,
  useToggleDiscountCode,
} from '../hooks/useQueries';

type FormState = {
  code: string;
  description: string;
  discountType: string;
  discountValue: string;
  minimumOrderAmount: string;
  maxUses: string;
  expiresAt: string;
};

const emptyForm: FormState = {
  code: '',
  description: '',
  discountType: 'percentage',
  discountValue: '',
  minimumOrderAmount: '0',
  maxUses: '',
  expiresAt: '',
};

function formToInput(form: FormState): DiscountCodeInput {
  const discountType: DiscountType =
    form.discountType === 'fixed' ? DiscountType.fixed : DiscountType.percentage;

  let expiresAt: bigint | undefined = undefined;
  if (form.expiresAt) {
    const ms = new Date(form.expiresAt).getTime();
    expiresAt = BigInt(ms) * 1_000_000n;
  }

  let maxUses: bigint | undefined = undefined;
  if (form.maxUses && form.maxUses.trim() !== '') {
    maxUses = BigInt(parseInt(form.maxUses, 10));
  }

  return {
    code: form.code.trim().toUpperCase(),
    description: form.description.trim(),
    discountType,
    discountValue: parseFloat(form.discountValue) || 0,
    minimumOrderAmount: parseFloat(form.minimumOrderAmount) || 0,
    maxUses,
    expiresAt,
  };
}

function discountToForm(dc: DiscountCode): FormState {
  let expiresAt = '';
  if (dc.expiresAt !== undefined && dc.expiresAt !== null) {
    const ms = Number(dc.expiresAt) / 1_000_000;
    const d = new Date(ms);
    const pad = (n: number) => String(n).padStart(2, '0');
    expiresAt = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  return {
    code: dc.code,
    description: dc.description,
    discountType: dc.discountType === DiscountType.fixed ? 'fixed' : 'percentage',
    discountValue: String(dc.discountValue),
    minimumOrderAmount: String(dc.minimumOrderAmount),
    maxUses: dc.maxUses !== undefined && dc.maxUses !== null ? String(dc.maxUses) : '',
    expiresAt,
  };
}

function extractError(err: unknown): string {
  if (!err) return '';
  const msg = err instanceof Error ? err.message : String(err);
  const match = msg.match(/Reject text: (.+)/);
  return match ? match[1] : msg;
}

export default function DiscountsPage() {
  const { data: discountCodes = [], isLoading } = useDiscountCodes();
  const createCode = useCreateDiscountCode();
  const updateCode = useUpdateDiscountCode();
  const deleteCode = useDeleteDiscountCode();
  const toggleCode = useToggleDiscountCode();

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DiscountCode | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saveError, setSaveError] = useState<string | null>(null);

  const openAdd = () => {
    setForm(emptyForm);
    setSaveError(null);
    createCode.reset();
    setAddOpen(true);
  };

  const closeAdd = () => {
    setAddOpen(false);
    setSaveError(null);
    createCode.reset();
  };

  const openEdit = (dc: DiscountCode) => {
    setEditTarget(dc);
    setForm(discountToForm(dc));
    setSaveError(null);
    updateCode.reset();
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setSaveError(null);
    updateCode.reset();
    setEditTarget(null);
  };

  const handleSaveNew = async () => {
    setSaveError(null);
    try {
      await createCode.mutateAsync(formToInput(form));
      closeAdd();
    } catch (err) {
      setSaveError(extractError(err));
    }
  };

  const handleSaveEdit = async () => {
    if (!editTarget) return;
    setSaveError(null);
    try {
      await updateCode.mutateAsync({ id: editTarget.id, input: formToInput(form) });
      closeEdit();
    } catch (err) {
      setSaveError(extractError(err));
    }
  };

  const handleDelete = async (id: bigint) => {
    if (!confirm('Delete this discount code?')) return;
    try {
      await deleteCode.mutateAsync(id);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleToggle = async (id: bigint) => {
    try {
      await toggleCode.mutateAsync(id);
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  const setField = (field: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const formatExpiry = (expiresAt: bigint | undefined | null) => {
    if (expiresAt === undefined || expiresAt === null) return 'Never';
    const ms = Number(expiresAt) / 1_000_000;
    return new Date(ms).toLocaleDateString();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Discount Codes</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage promotional discount codes</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4 mr-2" />
          New Discount Code
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : discountCodes.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Tag className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No discount codes yet. Create your first one!</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {discountCodes.map(dc => (
            <div
              key={String(dc.id)}
              className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-primary text-lg">{dc.code}</span>
                    <Badge variant={dc.isActive ? 'default' : 'secondary'}>
                      {dc.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  {dc.description && (
                    <p className="text-sm text-muted-foreground mt-1">{dc.description}</p>
                  )}
                </div>
              </div>

              <div className="text-sm space-y-1 text-muted-foreground">
                <div className="flex justify-between">
                  <span>Discount</span>
                  <span className="font-medium text-foreground">
                    {dc.discountType === DiscountType.percentage
                      ? `${dc.discountValue}%`
                      : `$${dc.discountValue.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Min. Order</span>
                  <span className="font-medium text-foreground">
                    ${dc.minimumOrderAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Uses</span>
                  <span className="font-medium text-foreground">
                    {String(dc.usedCount)}{' '}
                    {dc.maxUses !== undefined && dc.maxUses !== null
                      ? `/ ${String(dc.maxUses)}`
                      : '/ ∞'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Expires</span>
                  <span className="font-medium text-foreground">{formatExpiry(dc.expiresAt)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleToggle(dc.id)}
                  title={dc.isActive ? 'Deactivate' : 'Activate'}
                >
                  {dc.isActive ? (
                    <ToggleRight className="w-4 h-4 text-primary" />
                  ) : (
                    <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => openEdit(dc)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(dc.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={open => { if (!open) closeAdd(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Discount Code</DialogTitle>
          </DialogHeader>
          <DiscountForm
            form={form}
            setField={setField}
            saveError={saveError}
          />
          <DialogFooter>
            <Button variant="outline" onClick={closeAdd}>Cancel</Button>
            <Button
              onClick={handleSaveNew}
              disabled={createCode.isPending}
            >
              {createCode.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
              ) : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={open => { if (!open) closeEdit(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Discount Code</DialogTitle>
          </DialogHeader>
          <DiscountForm
            form={form}
            setField={setField}
            saveError={saveError}
          />
          <DialogFooter>
            <Button variant="outline" onClick={closeEdit}>Cancel</Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateCode.isPending}
            >
              {updateCode.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
              ) : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface DiscountFormProps {
  form: FormState;
  setField: (field: keyof FormState, value: string) => void;
  saveError: string | null;
}

function DiscountForm({ form, setField, saveError }: DiscountFormProps) {
  return (
    <div className="space-y-4">
      {saveError && (
        <Alert variant="destructive">
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label>Code</Label>
        <Input
          value={form.code}
          onChange={e => setField('code', e.target.value)}
          placeholder="e.g. SUMMER20"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea
          value={form.description}
          onChange={e => setField('description', e.target.value)}
          placeholder="Optional description"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select value={form.discountType} onValueChange={v => setField('discountType', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentage</SelectItem>
              <SelectItem value="fixed">Fixed Amount</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Value</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={form.discountValue}
            onChange={e => setField('discountValue', e.target.value)}
            placeholder={form.discountType === 'percentage' ? '10' : '5.00'}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Minimum Order Amount ($)</Label>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={form.minimumOrderAmount}
          onChange={e => setField('minimumOrderAmount', e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Max Uses (optional)</Label>
        <Input
          type="number"
          min="1"
          step="1"
          value={form.maxUses}
          onChange={e => setField('maxUses', e.target.value)}
          placeholder="Unlimited"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Expires At (optional)</Label>
        <Input
          type="datetime-local"
          value={form.expiresAt}
          onChange={e => setField('expiresAt', e.target.value)}
        />
      </div>
    </div>
  );
}
