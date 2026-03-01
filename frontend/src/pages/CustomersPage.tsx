import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search, User } from 'lucide-react';
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
} from '../hooks/useQueries';
import { Customer } from '../backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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

type CustomerForm = {
  name: string;
  mobileNo: string;
  email: string;
  preference: string;
  address: string;
};

const defaultForm: CustomerForm = {
  name: '',
  mobileNo: '',
  email: '',
  preference: '',
  address: '',
};

function extractErrorMessage(err: unknown): string {
  const msg = (err as Error)?.message ?? String(err);
  const match = msg.match(/Reject text: (.+)/);
  return match ? match[1] : msg;
}

export default function CustomersPage() {
  const { data: customers = [], isLoading } = useCustomers();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const [search, setSearch] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingId, setDeletingId] = useState<bigint | null>(null);
  const [form, setForm] = useState<CustomerForm>(defaultForm);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.mobileNo.includes(search)
  );

  function openAddDialog() {
    setForm(defaultForm);
    createCustomer.reset();
    setShowAddDialog(true);
  }

  function closeAddDialog() {
    setShowAddDialog(false);
    createCustomer.reset();
  }

  function openEdit(customer: Customer) {
    setForm({
      name: customer.name,
      mobileNo: customer.mobileNo,
      email: customer.email ?? '',
      preference: customer.preference,
      address: customer.address,
    });
    updateCustomer.reset();
    setEditingCustomer(customer);
  }

  function closeEditDialog() {
    setEditingCustomer(null);
    updateCustomer.reset();
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    await createCustomer.mutateAsync({
      name: form.name.trim(),
      mobileNo: form.mobileNo.trim(),
      email: form.email.trim() || null,
      preference: form.preference.trim(),
      address: form.address.trim(),
    });
    closeAddDialog();
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCustomer) return;
    await updateCustomer.mutateAsync({
      id: editingCustomer.id,
      name: form.name.trim(),
      mobileNo: form.mobileNo.trim(),
      email: form.email.trim() || null,
      preference: form.preference.trim(),
      address: form.address.trim(),
    });
    closeEditDialog();
  }

  async function handleDelete() {
    if (deletingId !== null) {
      await deleteCustomer.mutateAsync(deletingId);
      setDeletingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted rounded" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground">Manage your customer database.</p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name or phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <User className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              {search ? 'No customers match your search.' : 'No customers yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell">Loyalty Points</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(customer => (
                <TableRow key={customer.id.toString()}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.mobileNo}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {customer.email ?? '—'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="secondary">{Number(customer.loyaltyPoints)} pts</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(customer)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => setDeletingId(customer.id)}
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
      <Dialog open={showAddDialog} onOpenChange={open => !open && closeAddDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Customer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div>
              <Label>Mobile No.</Label>
              <Input value={form.mobileNo} onChange={e => setForm(p => ({ ...p, mobileNo: e.target.value }))} required />
            </div>
            <div>
              <Label>Email (optional)</Label>
              <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <Label>Preference</Label>
              <Input value={form.preference} onChange={e => setForm(p => ({ ...p, preference: e.target.value }))} />
            </div>
            <div>
              <Label>Address</Label>
              <Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
            </div>
            {createCustomer.isError && (
              <p className="text-destructive text-sm">{extractErrorMessage(createCustomer.error)}</p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeAddDialog}>Cancel</Button>
              <Button type="submit" disabled={createCustomer.isPending}>
                {createCustomer.isPending ? 'Adding...' : 'Add Customer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingCustomer} onOpenChange={open => !open && closeEditDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div>
              <Label>Mobile No.</Label>
              <Input value={form.mobileNo} onChange={e => setForm(p => ({ ...p, mobileNo: e.target.value }))} required />
            </div>
            <div>
              <Label>Email (optional)</Label>
              <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <Label>Preference</Label>
              <Input value={form.preference} onChange={e => setForm(p => ({ ...p, preference: e.target.value }))} />
            </div>
            <div>
              <Label>Address</Label>
              <Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
            </div>
            {updateCustomer.isError && (
              <p className="text-destructive text-sm">{extractErrorMessage(updateCustomer.error)}</p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeEditDialog}>Cancel</Button>
              <Button type="submit" disabled={updateCustomer.isPending}>
                {updateCustomer.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deletingId !== null} onOpenChange={open => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer?</AlertDialogTitle>
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
