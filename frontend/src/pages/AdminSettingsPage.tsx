import { useState } from 'react';
import { Settings, Shield, UserX, UserCheck, Copy, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useAdminPrincipal,
  useReassignAdmin,
  useVacateAdmin,
  useClaimAdminIfVacant,
} from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function AdminSettingsPage() {
  const { identity } = useInternetIdentity();
  const { data: adminPrincipal, isLoading: adminLoading } = useAdminPrincipal();
  const reassignAdmin = useReassignAdmin();
  const vacateAdmin = useVacateAdmin();
  const claimAdmin = useClaimAdminIfVacant();

  const [newPrincipalInput, setNewPrincipalInput] = useState('');
  const [reassignError, setReassignError] = useState('');
  const [copied, setCopied] = useState(false);

  const currentUserPrincipal = identity?.getPrincipal().toString() ?? '';
  const isAdminVacant = !adminPrincipal || adminPrincipal === '';
  const isCurrentUserAdmin = !!adminPrincipal && adminPrincipal === currentUserPrincipal;

  const handleCopyPrincipal = async () => {
    if (!currentUserPrincipal) return;
    await navigator.clipboard.writeText(currentUserPrincipal);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    setReassignError('');
    if (!newPrincipalInput.trim()) {
      setReassignError('Please enter a principal ID.');
      return;
    }
    try {
      await reassignAdmin.mutateAsync(newPrincipalInput.trim());
      toast.success('Admin role successfully reassigned!');
      setNewPrincipalInput('');
    } catch (err: any) {
      const msg = err?.message ?? 'Failed to reassign admin.';
      setReassignError(msg.includes('Unauthorized') ? 'Only the current admin can reassign the role.' : msg);
    }
  };

  const handleVacate = async () => {
    try {
      await vacateAdmin.mutateAsync();
      toast.success('Admin role has been vacated. Anyone can now claim it.');
    } catch (err: any) {
      const msg = err?.message ?? 'Failed to vacate admin role.';
      toast.error(msg.includes('Unauthorized') ? 'Only the current admin can vacate the role.' : msg);
    }
  };

  const handleClaim = async () => {
    try {
      await claimAdmin.mutateAsync();
      toast.success('You are now the admin!');
    } catch (err: any) {
      const msg = err?.message ?? 'Failed to claim admin role.';
      toast.error(msg.includes('already assigned') ? 'Admin role is already assigned to someone.' : msg);
    }
  };

  if (!identity) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Shield className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground text-lg">Please log in to access Admin Settings.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Settings className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Admin Settings</h1>
          <p className="text-sm text-muted-foreground">Manage the admin role for this application</p>
        </div>
      </div>

      {/* Current Admin Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-primary" />
            Current Admin
          </CardTitle>
          <CardDescription>The principal ID of the current admin account</CardDescription>
        </CardHeader>
        <CardContent>
          {adminLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          ) : isAdminVacant ? (
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">No admin assigned — role is vacant</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg font-mono text-xs break-all">
                <span className="flex-1">{adminPrincipal}</span>
                {adminPrincipal === currentUserPrincipal && (
                  <span className="shrink-0 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-sans font-medium">
                    You
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Your Principal ID */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCheck className="h-4 w-4 text-primary" />
            Your Principal ID
          </CardTitle>
          <CardDescription>Copy this to share with someone who needs to reassign admin to you</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg font-mono text-xs break-all">
            <span className="flex-1">{currentUserPrincipal}</span>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 h-7 w-7"
              onClick={handleCopyPrincipal}
              title="Copy principal ID"
            >
              {copied ? (
                <CheckCircle className="h-4 w-4 text-primary" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Claim Admin (if vacant) */}
      {isAdminVacant && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserCheck className="h-4 w-4 text-primary" />
              Claim Admin Role
            </CardTitle>
            <CardDescription>
              The admin role is currently vacant. You can claim it to become the admin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleClaim}
              disabled={claimAdmin.isPending}
              className="w-full sm:w-auto"
            >
              {claimAdmin.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Claiming...
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Claim Admin Role
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Reassign Admin */}
      {isCurrentUserAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserCheck className="h-4 w-4 text-primary" />
              Reassign Admin Role
            </CardTitle>
            <CardDescription>
              Transfer the admin role to another user by entering their principal ID.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleReassign} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-principal">New Admin Principal ID</Label>
                <Input
                  id="new-principal"
                  placeholder="e.g. aaaaa-aa or xxxxx-xxxxx-xxxxx-xxxxx-cai"
                  value={newPrincipalInput}
                  onChange={e => {
                    setNewPrincipalInput(e.target.value);
                    setReassignError('');
                  }}
                  className="font-mono text-sm"
                  disabled={reassignAdmin.isPending}
                />
                {reassignError && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {reassignError}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                disabled={reassignAdmin.isPending || !newPrincipalInput.trim()}
              >
                {reassignAdmin.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Reassigning...
                  </>
                ) : (
                  'Reassign Admin'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Vacate Admin Role */}
      {isCurrentUserAdmin && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <UserX className="h-4 w-4" />
              Vacate Admin Role
            </CardTitle>
            <CardDescription>
              Remove yourself as admin. The role will become vacant and anyone can claim it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={vacateAdmin.isPending}>
                  {vacateAdmin.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Vacating...
                    </>
                  ) : (
                    <>
                      <UserX className="h-4 w-4 mr-2" />
                      Vacate Admin Role
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Are you sure?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove your admin role. You will be <strong>locked out</strong> of all
                    admin-only features immediately. The role will become vacant and anyone who logs in
                    can claim it. This action cannot be undone without someone else reassigning the role
                    back to you.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleVacate}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Yes, Vacate Admin Role
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}

      {/* Info for non-admin logged-in users */}
      {!isAdminVacant && !isCurrentUserAdmin && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3 text-muted-foreground">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-amber-500" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Admin role is assigned</p>
                <p className="text-sm">
                  The admin role is currently assigned to another account. Only the current admin can
                  reassign or vacate the role. If you believe you should be the admin, ask the current
                  admin to reassign the role to your principal ID shown above.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
