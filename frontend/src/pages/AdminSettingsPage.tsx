import React from 'react';
import { useIsCallerAdmin, useGetCallerUserRole } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, ShieldCheck, Loader2, UserCog } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function AdminSettingsPage() {
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const { data: userRole, isLoading: roleLoading } = useGetCallerUserRole();
  const { actor } = useActor();
  const qc = useQueryClient();

  const claimAdmin = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      // Try to assign admin role to caller
      const { UserRole } = await import('../backend');
      const identity = (actor as any)._identity ?? null;
      if (!identity) throw new Error('No identity');
      // Use assignCallerUserRole if available
      return (actor as any).assignCallerUserRole(identity.getPrincipal(), UserRole.admin);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['isCallerAdmin'] });
      qc.invalidateQueries({ queryKey: ['callerUserRole'] });
    },
  });

  const isLoading = adminLoading || roleLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your admin role and permissions.</p>
      </div>

      {/* Current Role Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Current Role
          </CardTitle>
          <CardDescription>Your current access level in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            {isAdmin ? (
              <>
                <ShieldCheck className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-medium">Administrator</p>
                  <p className="text-sm text-muted-foreground">You have full access to all features.</p>
                </div>
                <Badge className="ml-auto">Admin</Badge>
              </>
            ) : (
              <>
                <Shield className="h-6 w-6 text-muted-foreground" />
                <div>
                  <p className="font-medium">Standard User</p>
                  <p className="text-sm text-muted-foreground">
                    Role: {userRole ? String(userRole) : 'user'}
                  </p>
                </div>
                <Badge variant="secondary" className="ml-auto">
                  {userRole ? String(userRole) : 'User'}
                </Badge>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Claim Admin Card — always shown for non-admins */}
      {!isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Claim Admin Role
            </CardTitle>
            <CardDescription>
              If no admin has been assigned yet, you can claim the admin role. The backend will reject this if an admin already exists.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => claimAdmin.mutate()}
              disabled={claimAdmin.isPending}
              className="w-full"
            >
              {claimAdmin.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Claiming...
                </>
              ) : (
                'Claim Admin Role'
              )}
            </Button>
            {claimAdmin.isError && (
              <p className="text-destructive text-sm mt-2">
                {(claimAdmin.error as Error)?.message ?? 'Failed to claim admin role.'}
              </p>
            )}
            {claimAdmin.isSuccess && (
              <p className="text-primary text-sm mt-2">Admin role claimed successfully!</p>
            )}
          </CardContent>
        </Card>
      )}

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Admin Controls</CardTitle>
            <CardDescription>You have full administrative access.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              As an admin, you can manage staff accounts, view audit logs, configure taxes, and manage discount codes from the sidebar navigation.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
