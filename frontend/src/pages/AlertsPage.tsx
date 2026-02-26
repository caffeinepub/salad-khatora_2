import { Bell, AlertTriangle, Calendar, Info, CalendarX, CheckCheck, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAlerts, useMarkAlertRead, useMarkAllAlertsRead } from '../hooks/useQueries';
import { AlertType } from '../backend';
import { format } from 'date-fns';

function AlertIcon({ type }: { type: AlertType }) {
  if (type === AlertType.lowStock) {
    return <AlertTriangle className="h-5 w-5 text-destructive" />;
  }
  if (type === AlertType.subscriptionRenewal) {
    return <Calendar className="h-5 w-5 text-primary" />;
  }
  if (type === AlertType.expiryWarning) {
    return <CalendarX className="h-5 w-5 text-orange-500" />;
  }
  return <Info className="h-5 w-5 text-muted-foreground" />;
}

function AlertTypeBadge({ type }: { type: AlertType }) {
  if (type === AlertType.lowStock) {
    return <Badge variant="destructive" className="text-xs">Low Stock</Badge>;
  }
  if (type === AlertType.subscriptionRenewal) {
    return <Badge className="text-xs bg-primary text-primary-foreground">Renewal</Badge>;
  }
  if (type === AlertType.expiryWarning) {
    return <Badge className="text-xs bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100">Expiry Warning</Badge>;
  }
  return <Badge variant="secondary" className="text-xs">Info</Badge>;
}

export default function AlertsPage() {
  const { data: alerts, isLoading, error } = useAlerts();
  const markRead = useMarkAlertRead();
  const markAllRead = useMarkAllAlertsRead();

  const unreadCount = alerts?.filter(a => !a.isRead).length ?? 0;

  const handleMarkRead = async (id: bigint) => {
    try {
      await markRead.mutateAsync(id);
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to mark alert as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead.mutateAsync();
      toast.success('All alerts marked as read');
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to mark all alerts as read');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="h-6 w-6 text-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Alerts</h1>
            <p className="text-muted-foreground text-sm">
              {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={handleMarkAllRead}
            disabled={markAllRead.isPending}
            className="gap-2 self-start sm:self-auto"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 flex gap-4">
              <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))
        ) : error ? (
          <div className="text-center text-destructive py-8">Failed to load alerts</div>
        ) : !alerts || alerts.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground font-medium">No alerts</p>
            <p className="text-sm text-muted-foreground">You're all caught up! Alerts will appear here when action is needed.</p>
          </div>
        ) : (
          alerts.map(alert => (
            <div
              key={alert.id.toString()}
              className={`rounded-xl border bg-card p-4 flex items-start gap-4 transition-opacity ${
                alert.isRead ? 'opacity-50 border-border' : 'border-border shadow-sm'
              }`}
            >
              <div className={`p-2 rounded-full flex-shrink-0 ${
                alert.alertType === AlertType.lowStock
                  ? 'bg-destructive/10'
                  : alert.alertType === AlertType.subscriptionRenewal
                  ? 'bg-primary/10'
                  : alert.alertType === AlertType.expiryWarning
                  ? 'bg-orange-100'
                  : 'bg-muted'
              }`}>
                <AlertIcon type={alert.alertType} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <AlertTypeBadge type={alert.alertType} />
                  {!alert.isRead && (
                    <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                  )}
                </div>
                <p className={`text-sm ${alert.isRead ? 'text-muted-foreground' : 'text-foreground font-medium'}`}>
                  {alert.message}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(Number(alert.createdAt) / 1_000_000), 'MMM d, yyyy HH:mm')}
                </p>
              </div>
              {!alert.isRead && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleMarkRead(alert.id)}
                  disabled={markRead.isPending}
                  className="h-8 w-8 flex-shrink-0"
                  title="Mark as read"
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
