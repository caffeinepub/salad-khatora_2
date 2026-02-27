import React, { useState } from 'react';
import { Plus, Edit, Trash2, Shield, User, Briefcase, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  useStaffAccounts,
  useCreateStaffAccount,
  useUpdateStaffAccount,
  useDeleteStaffAccount,
} from '@/hooks/useQueries';
import type { StaffAccount } from '../backend';
import { StaffRole } from '../backend';

function truncatePrincipal(p: string): string {
  if (p.length <= 16) return p;
  return p.slice(0, 8) + '...' + p.slice(-6);
}

function formatDate(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleDateString();
}

function getRoleBadge(role: StaffRole) {
  switch (role) {
    case StaffRole.admin:
      return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-0"><Shield className="w-3 h-3 mr-1" />Admin</Badge>;
    case StaffRole.manager:
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-0"><Briefcase className="w-3 h-3 mr-1" />Manager</Badge>;
    case StaffRole.cashier:
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-0"><User className="w-3 h-3 mr-1" />Cashier</Badge>;
    default:
      return <Badge variant="secondary">{String(role)}</Badge>;
  }
}

interface AddFormData {
  principal: string;
  name: string;
  role: StaffRole;
}

interface EditFormData {
  name: string;
  role: StaffRole;
  isActive: boolean;
}

export default function StaffAccountsPage() {
  const { data: accounts, isLoading } = useStaffAccounts();
  const createAccount = useCreateStaffAccount();
  const updateAccount = useUpdateStaffAccount();
  const deleteAccount = useDeleteStaffAccount();

  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<StaffAccount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffAccount | null>(null);

  const [addForm, setAddForm] = useState<AddFormData>({ principal: '', name: '', role: StaffRole.cashier });
  const [editForm, setEditForm] = useState<EditFormData>({ name: '', role: StaffRole.cashier, isActive: true });

  const handleAdd = async () => {
    if (!addForm.principal.trim() || !addForm.name.trim()) return;
    try {
      await createAccount.mutateAsync({ principal: addForm.principal.trim(), name: addForm.name.trim(), role: addForm.role });
      setShowAdd(false);
      setAddForm({ principal: '', name: '', role: StaffRole.cashier });
    } catch {
      // error handled by mutation
    }
  };

  const openEdit = (account: StaffAccount) => {
    setEditTarget(account);
    setEditForm({ name: account.name, role: account.role, isActive: account.isActive });
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    try {
      await updateAccount.mutateAsync({ id: editTarget.id, name: editForm.name, role: editForm.role, isActive: editForm.isActive });
      setEditTarget(null);
    } catch {
      // error handled by mutation
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAccount.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // error handled by mutation
    }
  };

  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Staff Accounts</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage staff roles and access</p>
          </div>
          <Button onClick={() => setShowAdd(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Staff Account
          </Button>
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
                  <TableHead>Principal</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(accounts ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                      No staff accounts yet. Add one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  (accounts ?? []).map(account => (
                    <TableRow key={account.id.toString()}>
                      <TableCell className="font-medium">{account.name}</TableCell>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="font-mono text-xs cursor-default text-muted-foreground">
                              {truncatePrincipal(account.principal.toString())}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-mono text-xs">{account.principal.toString()}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell>{getRoleBadge(account.role)}</TableCell>
                      <TableCell>
                        {account.isActive ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-0">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{formatDate(account.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(account)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(account)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
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
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Staff Account</DialogTitle>
              <DialogDescription>Enter the principal ID, name, and role for the new staff member.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <Label htmlFor="principal">Principal ID</Label>
                <Input
                  id="principal"
                  placeholder="e.g. aaaaa-aa or full principal"
                  value={addForm.principal}
                  onChange={e => setAddForm(f => ({ ...f, principal: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Staff member name"
                  value={addForm.name}
                  onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="role">Role</Label>
                <Select value={addForm.role} onValueChange={v => setAddForm(f => ({ ...f, role: v as StaffRole }))}>
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={StaffRole.cashier}>Cashier</SelectItem>
                    <SelectItem value={StaffRole.manager}>Manager</SelectItem>
                    <SelectItem value={StaffRole.admin}>Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={createAccount.isPending || !addForm.principal.trim() || !addForm.name.trim()}>
                {createAccount.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Add Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={!!editTarget} onOpenChange={open => !open && setEditTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Staff Account</DialogTitle>
              <DialogDescription>Update the name, role, or status of this staff member.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-role">Role</Label>
                <Select value={editForm.role} onValueChange={v => setEditForm(f => ({ ...f, role: v as StaffRole }))}>
                  <SelectTrigger id="edit-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={StaffRole.cashier}>Cashier</SelectItem>
                    <SelectItem value={StaffRole.manager}>Manager</SelectItem>
                    <SelectItem value={StaffRole.admin}>Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  id="edit-active"
                  checked={editForm.isActive}
                  onCheckedChange={v => setEditForm(f => ({ ...f, isActive: v }))}
                />
                <Label htmlFor="edit-active">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
              <Button onClick={handleEdit} disabled={updateAccount.isPending || !editForm.name.trim()}>
                {updateAccount.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Staff Account</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleDelete}
                disabled={deleteAccount.isPending}
              >
                {deleteAccount.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
