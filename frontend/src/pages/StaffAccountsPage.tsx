import React, { useState } from 'react';
import { Plus, Edit, Trash2, Shield, User, Loader2 } from 'lucide-react';
import { Principal } from '@dfinity/principal';
import {
  useStaffAccounts,
  useCreateStaffAccount,
  useUpdateStaffAccount,
  useDeleteStaffAccount,
} from '../hooks/useQueries';
import { StaffAccount, StaffRole } from '../backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
import { Switch } from '@/components/ui/switch';

const ROLES: StaffRole[] = [StaffRole.cashier, StaffRole.manager, StaffRole.admin];

function roleBadgeVariant(role: StaffRole): 'default' | 'secondary' | 'outline' {
  switch (role) {
    case StaffRole.admin: return 'default';
    case StaffRole.manager: return 'secondary';
    default: return 'outline';
  }
}

function extractError(err: unknown): string {
  const msg = (err as Error)?.message ?? String(err);
  const match = msg.match(/Reject text: (.+)/);
  return match ? match[1] : msg;
}

export default function StaffAccountsPage() {
  const { data: accounts = [], isLoading } = useStaffAccounts();
  const createAccount = useCreateStaffAccount();
  const updateAccount = useUpdateStaffAccount();
  const deleteAccount = useDeleteStaffAccount();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<StaffAccount | null>(null);
  const [deletingId, setDeletingId] = useState<bigint | null>(null);

  const [formPrincipal, setFormPrincipal] = useState('');
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState<StaffRole>(StaffRole.cashier);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  function openAdd() {
    setFormPrincipal('');
    setFormName('');
    setFormRole(StaffRole.cashier);
    setFormIsActive(true);
    setFormError(null);
    createAccount.reset();
    setShowAddDialog(true);
  }

  function openEdit(account: StaffAccount) {
    setFormName(account.name);
    setFormRole(account.role);
    setFormIsActive(account.isActive);
    setFormError(null);
    updateAccount.reset();
    setEditingAccount(account);
  }

  function closeDialogs() {
    setShowAddDialog(false);
    setEditingAccount(null);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    try {
      const principal = Principal.fromText(formPrincipal.trim());
      await createAccount.mutateAsync({
        principal,
        name: formName.trim(),
        role: formRole,
      });
      closeDialogs();
    } catch (err) {
      setFormError(extractError(err));
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingAccount) return;
    setFormError(null);
    try {
      await updateAccount.mutateAsync({
        id: editingAccount.id,
        name: formName.trim(),
        role: formRole,
        isActive: formIsActive,
      });
      closeDialogs();
    } catch (err) {
      setFormError(extractError(err));
    }
  }

  async function handleDelete() {
    if (deletingId !== null) {
      await deleteAccount.mutateAsync(deletingId);
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
          <h1 className="text-2xl font-bold text-foreground">Staff Accounts</h1>
          <p className="text-muted-foreground">Manage staff access and roles.</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Staff
        </Button>
      </div>

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <User className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No staff accounts yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Principal</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map(account => (
                <TableRow key={account.id.toString()}>
                  <TableCell className="font-medium">{account.name}</TableCell>
                  <TableCell className="text-muted-foreground text-xs font-mono">
                    {account.principal.toString().slice(0, 20)}...
                  </TableCell>
                  <TableCell>
                    <Badge variant={roleBadgeVariant(account.role)} className="capitalize">
                      {account.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={account.isActive ? 'default' : 'secondary'}>
                      {account.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(account)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => setDeletingId(account.id)}
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
      <Dialog open={showAddDialog} onOpenChange={open => !open && closeDialogs()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Staff Account</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <Label>Principal ID</Label>
              <Input
                value={formPrincipal}
                onChange={e => setFormPrincipal(e.target.value)}
                placeholder="aaaaa-aa..."
                required
              />
            </div>
            <div>
              <Label>Name</Label>
              <Input
                value={formName}
                onChange={e => setFormName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={formRole} onValueChange={val => setFormRole(val as StaffRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => (
                    <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formError && <p className="text-destructive text-sm">{formError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialogs}>Cancel</Button>
              <Button type="submit" disabled={createAccount.isPending}>
                {createAccount.isPending ? 'Adding...' : 'Add Staff'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingAccount} onOpenChange={open => !open && closeDialogs()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Staff Account</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={formName}
                onChange={e => setFormName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={formRole} onValueChange={val => setFormRole(val as StaffRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => (
                    <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={formIsActive}
                onCheckedChange={setFormIsActive}
                id="is-active"
              />
              <Label htmlFor="is-active">Active</Label>
            </div>
            {formError && <p className="text-destructive text-sm">{formError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialogs}>Cancel</Button>
              <Button type="submit" disabled={updateAccount.isPending}>
                {updateAccount.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deletingId !== null} onOpenChange={open => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Staff Account?</AlertDialogTitle>
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
