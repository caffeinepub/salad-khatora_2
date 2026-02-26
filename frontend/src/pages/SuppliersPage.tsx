import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Zap, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
  useAutoGeneratePurchaseOrders,
  Supplier,
} from '../hooks/useQueries';

interface SupplierFormData {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  leadTimeDays: string;
  notes: string;
}

const emptyForm: SupplierFormData = {
  name: '',
  contactPerson: '',
  email: '',
  phone: '',
  address: '',
  leadTimeDays: '',
  notes: '',
};

function validateForm(form: SupplierFormData): string | null {
  if (!form.name.trim()) return 'Name is required';
  if (!form.contactPerson.trim()) return 'Contact person is required';
  if (!form.email.trim()) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Invalid email address';
  if (!form.phone.trim()) return 'Phone is required';
  if (!form.address.trim()) return 'Address is required';
  if (!form.leadTimeDays.trim() || isNaN(Number(form.leadTimeDays)) || Number(form.leadTimeDays) < 0)
    return 'Lead time must be a valid non-negative number';
  return null;
}

export default function SuppliersPage() {
  const { data: suppliers, isLoading, error } = useSuppliers();
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();
  const autoGenerate = useAutoGeneratePurchaseOrders();

  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<SupplierFormData>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const filtered = (suppliers ?? []).filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setForm(emptyForm);
    setFormError(null);
    setAddOpen(true);
  };

  const openEdit = (supplier: Supplier) => {
    setEditSupplier(supplier);
    setForm({
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      leadTimeDays: supplier.leadTimeDays.toString(),
      notes: supplier.notes,
    });
    setFormError(null);
  };

  const handleAddSubmit = async () => {
    const err = validateForm(form);
    if (err) { setFormError(err); return; }
    try {
      await createSupplier.mutateAsync({
        name: form.name.trim(),
        contactPerson: form.contactPerson.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        leadTimeDays: Math.round(Number(form.leadTimeDays)),
        notes: form.notes.trim(),
      });
      toast.success('Supplier added successfully');
      setAddOpen(false);
      setForm(emptyForm);
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to add supplier');
    }
  };

  const handleEditSubmit = async () => {
    if (!editSupplier) return;
    const err = validateForm(form);
    if (err) { setFormError(err); return; }
    try {
      await updateSupplier.mutateAsync({
        id: editSupplier.id,
        name: form.name.trim(),
        contactPerson: form.contactPerson.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        leadTimeDays: Math.round(Number(form.leadTimeDays)),
        notes: form.notes.trim(),
      });
      toast.success('Supplier updated successfully');
      setEditSupplier(null);
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to update supplier');
    }
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await deleteSupplier.mutateAsync(deleteId);
      toast.success('Supplier deleted');
      setDeleteId(null);
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to delete supplier');
    }
  };

  const handleAutoGenerate = async () => {
    try {
      await autoGenerate.mutateAsync();
      toast.success('Purchase orders generated for low-stock ingredients');
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to generate purchase orders');
    }
  };

  const SupplierFormFields = () => (
    <div className="grid gap-4 py-2">
      {formError && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{formError}</p>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Supplier name"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contactPerson">Contact Person *</Label>
          <Input
            id="contactPerson"
            value={form.contactPerson}
            onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))}
            placeholder="Contact name"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="email@example.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone *</Label>
          <Input
            id="phone"
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            placeholder="+1 234 567 8900"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="address">Address *</Label>
        <Input
          id="address"
          value={form.address}
          onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
          placeholder="Full address"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="leadTimeDays">Lead Time (days) *</Label>
        <Input
          id="leadTimeDays"
          type="number"
          min="0"
          value={form.leadTimeDays}
          onChange={e => setForm(f => ({ ...f, leadTimeDays: e.target.value }))}
          placeholder="e.g. 3"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          placeholder="Optional notes..."
          rows={2}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Suppliers</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your ingredient suppliers and generate purchase orders</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={handleAutoGenerate}
            disabled={autoGenerate.isPending}
            className="gap-2"
          >
            {autoGenerate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Generate Purchase Orders
          </Button>
          <Button onClick={openAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Supplier
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search suppliers..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Name</TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Lead Time</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-destructive py-8">
                  Failed to load suppliers
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                  {search ? 'No suppliers match your search' : 'No suppliers yet. Add your first supplier!'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(supplier => (
                <TableRow key={supplier.id.toString()} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>{supplier.contactPerson}</TableCell>
                  <TableCell className="text-muted-foreground">{supplier.email}</TableCell>
                  <TableCell>{supplier.phone}</TableCell>
                  <TableCell>{supplier.leadTimeDays.toString()} days</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(supplier)}
                        className="h-8 w-8"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(supplier.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Supplier</DialogTitle>
            <DialogDescription>Fill in the supplier details below.</DialogDescription>
          </DialogHeader>
          <SupplierFormFields />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAddSubmit} disabled={createSupplier.isPending}>
              {createSupplier.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Add Supplier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editSupplier} onOpenChange={open => !open && setEditSupplier(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
            <DialogDescription>Update the supplier details below.</DialogDescription>
          </DialogHeader>
          <SupplierFormFields />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSupplier(null)}>Cancel</Button>
            <Button onClick={handleEditSubmit} disabled={updateSupplier.isPending}>
              {updateSupplier.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this supplier? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteSupplier.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
