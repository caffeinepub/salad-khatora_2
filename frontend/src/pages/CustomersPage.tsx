import React, { useState } from 'react';
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import type { Customer } from '../backend';
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
import { Badge } from '@/components/ui/badge';
import { UserPlus, Search, Edit, Trash2, Eye, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import CustomerDetailView from '../components/CustomerDetailView';

interface CustomerFormData {
  name: string;
  mobileNo: string;
  email: string;
  preference: string;
  address: string;
}

const emptyForm: CustomerFormData = {
  name: '',
  mobileNo: '',
  email: '',
  preference: '',
  address: '',
};

function extractErrorMessage(error: unknown): string {
  if (!error) return 'An unknown error occurred';
  const msg = error instanceof Error ? error.message : String(error);
  const match = msg.match(/Reject text: (.+)$/s);
  if (match) return match[1].trim();
  return msg;
}

export default function CustomersPage() {
  const { actor, isFetching: actorFetching } = useActor();
  const actorReady = !!actor && !actorFetching;

  const { data: customers = [], isLoading } = useCustomers();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [detailCustomerId, setDetailCustomerId] = useState<bigint | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>(emptyForm);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.mobileNo.includes(search) ||
      (c.email ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  const openAddDialog = () => {
    setFormData(emptyForm);
    createCustomer.reset();
    setAddOpen(true);
  };

  const closeAddDialog = () => {
    setAddOpen(false);
    createCustomer.reset();
  };

  const openEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      mobileNo: customer.mobileNo,
      email: customer.email ?? '',
      preference: customer.preference,
      address: customer.address,
    });
    updateCustomer.reset();
    setEditOpen(true);
  };

  const closeEditDialog = () => {
    setEditOpen(false);
    updateCustomer.reset();
  };

  const handleAdd = async () => {
    if (!actorReady) return;
    try {
      await createCustomer.mutateAsync({
        name: formData.name,
        mobileNo: formData.mobileNo,
        email: formData.email.trim() || null,
        preference: formData.preference,
        address: formData.address,
      });
      closeAddDialog();
    } catch {
      // error shown in UI
    }
  };

  const handleEdit = async () => {
    if (!selectedCustomer || !actorReady) return;
    try {
      await updateCustomer.mutateAsync({
        id: selectedCustomer.id,
        name: formData.name,
        mobileNo: formData.mobileNo,
        email: formData.email.trim() || null,
        preference: formData.preference,
        address: formData.address,
      });
      closeEditDialog();
    } catch {
      // error shown in UI
    }
  };

  const handleDelete = async () => {
    if (!selectedCustomer) return;
    try {
      await deleteCustomer.mutateAsync(selectedCustomer.id);
      setDeleteOpen(false);
      setSelectedCustomer(null);
    } catch {
      // error shown in UI
    }
  };

  const handleFormChange = (field: keyof CustomerFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Show detail view if a customer is selected
  if (detailCustomerId !== null) {
    return (
      <CustomerDetailView
        customerId={detailCustomerId}
        onBack={() => setDetailCustomerId(null)}
      />
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your customer database and loyalty points</p>
        </div>
        <Button
          onClick={openAddDialog}
          disabled={!actorReady}
          className="flex items-center gap-2"
        >
          {actorFetching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
          {actorFetching ? 'Initializing...' : 'Add Customer'}
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, phone, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Actor not ready warning */}
      {actorFetching && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>Connecting to the backend, please wait...</AlertDescription>
        </Alert>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {search ? 'No customers match your search.' : 'No customers yet. Add your first customer!'}
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Mobile</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Loyalty Points</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Preference</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((customer) => (
                  <tr key={customer.id.toString()} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{customer.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{customer.mobileNo}</td>
                    <td className="px-4 py-3 text-muted-foreground">{customer.email ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        {customer.loyaltyPoints.toString()} pts
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{customer.preference || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDetailCustomerId(customer.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(customer)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setDeleteOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((customer) => (
              <div key={customer.id.toString()} className="rounded-lg border border-border p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-sm text-muted-foreground">{customer.mobileNo}</p>
                    {customer.email && <p className="text-sm text-muted-foreground">{customer.email}</p>}
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {customer.loyaltyPoints.toString()} pts
                  </Badge>
                </div>
                {customer.preference && (
                  <p className="text-sm text-muted-foreground">Pref: {customer.preference}</p>
                )}
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setDetailCustomerId(customer.id)}
                  >
                    <Eye className="h-3 w-3 mr-1" /> View
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(customer)}>
                    <Edit className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setDeleteOpen(true);
                    }}
                  >
                    <Trash2 className="h-3 w-3 mr-1" /> Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add Customer Dialog */}
      <Dialog open={addOpen} onOpenChange={(open) => { if (!open) closeAddDialog(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Customer</DialogTitle>
            <DialogDescription>Fill in the customer details below.</DialogDescription>
          </DialogHeader>

          {!actorReady && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>Connecting to backend, please wait before submitting...</AlertDescription>
            </Alert>
          )}

          {createCustomer.isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{extractErrorMessage(createCustomer.error)}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="add-name">Name *</Label>
              <Input
                id="add-name"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                placeholder="Customer name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="add-mobile">Mobile No *</Label>
              <Input
                id="add-mobile"
                value={formData.mobileNo}
                onChange={(e) => handleFormChange('mobileNo', e.target.value)}
                placeholder="Mobile number"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="add-email">Email</Label>
              <Input
                id="add-email"
                type="email"
                value={formData.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
                placeholder="Email address (optional)"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="add-preference">Preference</Label>
              <Input
                id="add-preference"
                value={formData.preference}
                onChange={(e) => handleFormChange('preference', e.target.value)}
                placeholder="e.g. Veg, Non-veg"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="add-address">Address</Label>
              <Input
                id="add-address"
                value={formData.address}
                onChange={(e) => handleFormChange('address', e.target.value)}
                placeholder="Address"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeAddDialog} disabled={createCustomer.isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!actorReady || createCustomer.isPending || !formData.name || !formData.mobileNo}
            >
              {createCustomer.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Adding...
                </>
              ) : !actorReady ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Initializing...
                </>
              ) : (
                'Add Customer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={editOpen} onOpenChange={(open) => { if (!open) closeEditDialog(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>Update the customer details below.</DialogDescription>
          </DialogHeader>

          {updateCustomer.isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{extractErrorMessage(updateCustomer.error)}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                placeholder="Customer name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-mobile">Mobile No *</Label>
              <Input
                id="edit-mobile"
                value={formData.mobileNo}
                onChange={(e) => handleFormChange('mobileNo', e.target.value)}
                placeholder="Mobile number"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
                placeholder="Email address (optional)"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-preference">Preference</Label>
              <Input
                id="edit-preference"
                value={formData.preference}
                onChange={(e) => handleFormChange('preference', e.target.value)}
                placeholder="e.g. Veg, Non-veg"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => handleFormChange('address', e.target.value)}
                placeholder="Address"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeEditDialog} disabled={updateCustomer.isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={!actorReady || updateCustomer.isPending || !formData.name || !formData.mobileNo}
            >
              {updateCustomer.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedCustomer?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteCustomer.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteCustomer.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCustomer.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
