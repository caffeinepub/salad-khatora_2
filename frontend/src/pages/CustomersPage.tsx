import React, { useState } from 'react';
import { Search, Plus, Edit, Trash2, Loader2, ChevronRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
} from '../hooks/useQueries';
import type { Customer } from '../backend';
import CustomerDetailView from '../components/CustomerDetailView';

function formatDate(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleDateString();
}

interface CustomerForm {
  name: string;
  mobileNo: string;
  email: string;
  preference: string;
  address: string;
}

const emptyForm: CustomerForm = {
  name: '',
  mobileNo: '',
  email: '',
  preference: '',
  address: '',
};

export default function CustomersPage() {
  const { data: customers = [], isLoading } = useCustomers();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<bigint | null>(null);

  const [addForm, setAddForm] = useState<CustomerForm>(emptyForm);
  const [editForm, setEditForm] = useState<CustomerForm>(emptyForm);
  const [addError, setAddError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
    c.mobileNo.toLowerCase().includes(search.toLowerCase())
  );

  const isAddFormValid = addForm.name.trim() && addForm.mobileNo.trim() && addForm.preference.trim() && addForm.address.trim();
  const isEditFormValid = editForm.name.trim() && editForm.mobileNo.trim() && editForm.preference.trim() && editForm.address.trim();

  const openAddDialog = () => {
    setAddForm(emptyForm);
    setAddError(null);
    createCustomer.reset();
    setShowAdd(true);
  };

  const closeAddDialog = () => {
    setShowAdd(false);
    setAddForm(emptyForm);
    setAddError(null);
    createCustomer.reset();
  };

  const handleAdd = async () => {
    if (!isAddFormValid) return;
    setAddError(null);
    try {
      await createCustomer.mutateAsync({
        name: addForm.name.trim(),
        mobileNo: addForm.mobileNo.trim(),
        email: addForm.email.trim() || undefined,
        preference: addForm.preference.trim(),
        address: addForm.address.trim(),
      });
      closeAddDialog();
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : String(err);
      // Extract the meaningful part of the error message
      const match = raw.match(/Reject text: (.+)/);
      const message = match ? match[1] : raw || 'Failed to save customer. Please try again.';
      setAddError(message);
    }
  };

  const openEdit = (customer: Customer) => {
    setEditTarget(customer);
    setEditError(null);
    updateCustomer.reset();
    setEditForm({
      name: customer.name,
      mobileNo: customer.mobileNo,
      email: customer.email ?? '',
      preference: customer.preference,
      address: customer.address,
    });
  };

  const closeEditDialog = () => {
    setEditTarget(null);
    setEditError(null);
    updateCustomer.reset();
  };

  const handleEdit = async () => {
    if (!editTarget || !isEditFormValid) return;
    setEditError(null);
    try {
      await updateCustomer.mutateAsync({
        id: editTarget.id,
        name: editForm.name.trim(),
        mobileNo: editForm.mobileNo.trim(),
        email: editForm.email.trim() || undefined,
        preference: editForm.preference.trim(),
        address: editForm.address.trim(),
      });
      closeEditDialog();
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : String(err);
      const match = raw.match(/Reject text: (.+)/);
      const message = match ? match[1] : raw || 'Failed to update customer. Please try again.';
      setEditError(message);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCustomer.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // handled by mutation
    }
  };

  if (selectedCustomerId !== null) {
    return (
      <CustomerDetailView
        customerId={selectedCustomerId}
        onBack={() => setSelectedCustomerId(null)}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your customer base</p>
        </div>
        <Button onClick={openAddDialog} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Customer
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search customers..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Mobile No</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Loyalty Points</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                    {search ? 'No customers match your search.' : 'No customers yet. Add one to get started.'}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(customer => (
                  <TableRow
                    key={customer.id.toString()}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedCustomerId(customer.id)}
                  >
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell className="text-muted-foreground">{customer.mobileNo || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{customer.email ?? 'N/A'}</TableCell>
                    <TableCell>{customer.loyaltyPoints.toString()}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(customer.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(customer)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(customer)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <ChevronRight className="w-4 h-4 text-muted-foreground ml-1" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add Dialog */}
      <Dialog
        open={showAdd}
        onOpenChange={open => {
          if (!open) closeAddDialog();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Customer</DialogTitle>
            <DialogDescription>Enter the customer's details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {addError && (
              <div className="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{addError}</span>
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="add-name">Name *</Label>
              <Input
                id="add-name"
                value={addForm.name}
                onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="add-mobile">Mobile No *</Label>
              <Input
                id="add-mobile"
                type="tel"
                value={addForm.mobileNo}
                onChange={e => setAddForm(f => ({ ...f, mobileNo: e.target.value }))}
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="add-email">
                Email <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="add-email"
                type="email"
                value={addForm.email}
                onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="add-preference">Preference *</Label>
              <Input
                id="add-preference"
                value={addForm.preference}
                onChange={e => setAddForm(f => ({ ...f, preference: e.target.value }))}
                placeholder="e.g. Veg, Non-Veg, Vegan"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="add-address">Address *</Label>
              <Textarea
                id="add-address"
                value={addForm.address}
                onChange={e => setAddForm(f => ({ ...f, address: e.target.value }))}
                placeholder="Enter full address"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeAddDialog}
              disabled={createCustomer.isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={createCustomer.isPending || !isAddFormValid}>
              {createCustomer.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editTarget}
        onOpenChange={open => {
          if (!open) closeEditDialog();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>Update the customer's details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {editError && (
              <div className="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{editError}</span>
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-mobile">Mobile No *</Label>
              <Input
                id="edit-mobile"
                type="tel"
                value={editForm.mobileNo}
                onChange={e => setEditForm(f => ({ ...f, mobileNo: e.target.value }))}
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-email">
                Email <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-preference">Preference *</Label>
              <Input
                id="edit-preference"
                value={editForm.preference}
                onChange={e => setEditForm(f => ({ ...f, preference: e.target.value }))}
                placeholder="e.g. Veg, Non-Veg, Vegan"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-address">Address *</Label>
              <Textarea
                id="edit-address"
                value={editForm.address}
                onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))}
                placeholder="Enter full address"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeEditDialog}
              disabled={updateCustomer.isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={updateCustomer.isPending || !isEditFormValid}>
              {updateCustomer.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleteCustomer.isPending}
            >
              {deleteCustomer.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
