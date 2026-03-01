import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Loader2 } from 'lucide-react';
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
import { Card, CardContent } from '@/components/ui/card';
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
  Supplier,
} from '../hooks/useQueries';

interface SupplierFormData {
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  leadTimeDays: string;
  notes: string;
}

const emptyForm: SupplierFormData = {
  name: '',
  contactName: '',
  email: '',
  phone: '',
  address: '',
  leadTimeDays: '3',
  notes: '',
};

function validateForm(form: SupplierFormData): string | null {
  if (!form.name.trim()) return 'Name is required';
  if (!form.contactName.trim()) return 'Contact name is required';
  if (!form.email.trim()) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Invalid email address';
  if (!form.phone.trim()) return 'Phone is required';
  if (!form.address.trim()) return 'Address is required';
  if (!form.leadTimeDays.trim() || isNaN(Number(form.leadTimeDays)) || Number(form.leadTimeDays) < 0)
    return 'Lead time must be a valid non-negative number';
  return null;
}

export default function SuppliersPage() {
  const { data: suppliers, isLoading } = useSuppliers();
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();

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
      contactName: supplier.contactName ?? supplier.contactPerson ?? '',
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      leadTimeDays: (supplier.leadTimeDays ?? 3).toString(),
      notes: supplier.notes ?? '',
    });
    setFormError(null);
  };

  const handleAddSubmit = async () => {
    const err = validateForm(form);
    if (err) { setFormError(err); return; }
    try {
      await createSupplier.mutateAsync({
        name: form.name.trim(),
        contactName: form.contactName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        leadTimeDays: Math.round(Number(form.leadTimeDays)),
        notes: form.notes.trim(),
        ingredients: [],
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
        contactName: form.contactName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        leadTimeDays: Math.round(Number(form.leadTimeDays)),
        notes: form.notes.trim(),
        ingredients: editSupplier.ingredients ?? [],
        createdAt: editSupplier.createdAt,
      });
      toast.success('Supplier updated successfully');
      setEditSupplier(null);
      setForm(emptyForm);
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

  const SupplierForm = () => (
    <div className="space-y-4 py-2">
      {formError && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{formError}</p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Name *</Label>
          <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Supplier name" />
        </div>
        <div className="space-y-1.5">
          <Label>Contact Name *</Label>
          <Input value={form.contactName} onChange={e => setForm(p => ({ ...p, contactName: e.target.value }))} placeholder="Contact person" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Email *</Label>
          <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="email@example.com" />
        </div>
        <div className="space-y-1.5">
          <Label>Phone *</Label>
          <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+91 ..." />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Address *</Label>
        <Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Full address" />
      </div>
      <div className="space-y-1.5">
        <Label>Lead Time (days)</Label>
        <Input type="number" min={0} value={form.leadTimeDays} onChange={e => setForm(p => ({ ...p, leadTimeDays: e.target.value }))} />
      </div>
      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} placeholder="Optional notes..." />
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Suppliers</h1>
          <p className="text-muted-foreground mt-1">Manage your ingredient suppliers.</p>
        </div>
        <Button onClick={openAdd}>
          <Plus size={16} className="mr-2" />
          Add Supplier
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search suppliers..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">
              {search ? 'No suppliers match your search.' : 'No suppliers yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Contact</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead className="hidden lg:table-cell">Lead Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(supplier => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {supplier.contactName ?? supplier.contactPerson ?? '—'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{supplier.email}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{supplier.phone}</TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {supplier.leadTimeDays != null ? `${supplier.leadTimeDays}d` : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(supplier)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => setDeleteId(supplier.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={open => { setAddOpen(open); if (!open) setFormError(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Supplier</DialogTitle>
            <DialogDescription>Add a new ingredient supplier.</DialogDescription>
          </DialogHeader>
          <SupplierForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAddSubmit} disabled={createSupplier.isPending}>
              {createSupplier.isPending ? <><Loader2 size={14} className="animate-spin mr-2" />Adding...</> : 'Add Supplier'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editSupplier} onOpenChange={open => { if (!open) { setEditSupplier(null); setFormError(null); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
            <DialogDescription>Update supplier information.</DialogDescription>
          </DialogHeader>
          <SupplierForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSupplier(null)}>Cancel</Button>
            <Button onClick={handleEditSubmit} disabled={updateSupplier.isPending}>
              {updateSupplier.isPending ? <><Loader2 size={14} className="animate-spin mr-2" />Saving...</> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supplier?</AlertDialogTitle>
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
