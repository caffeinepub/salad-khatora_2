import React from 'react';
import { Bell, CheckCheck, Package, AlertTriangle, ShoppingCart, Info } from 'lucide-react';
import { useAlerts, useMarkAlertRead, useMarkAllAlertsRead, AlertType } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

function getAlertIcon(type?: AlertType) {
  switch (type) {
    case 'low_stock': return <Package className="h-4 w-4 text-warning" />;
    case 'expiry': return <AlertTriangle className="h-4 w-4 text-destructive" />;
    case 'order': return <ShoppingCart className="h-4 w-4 text-primary" />;
    default: return <Info className="h-4 w-4 text-muted-foreground" />;
  }
}

function getAlertBadge(type?: AlertType) {
  switch (type) {
    case 'low_stock': return <Badge variant="outline" className="text-warning border-warning">Low Stock</Badge>;
    case 'expiry': return <Badge variant="destructive">Expiry</Badge>;
    case 'order': return <Badge variant="default">Order</Badge>;
    default: return <Badge variant="secondary">System</Badge>;
  }
}

export default function AlertsPage() {
  const { data: alerts = [], isLoading } = useAlerts();
  const markRead = useMarkAlertRead();
  const markAllRead = useMarkAllAlertsRead();

  const unreadAlerts = alerts.filter(a => !a.isRead);
  const unreadIds = unreadAlerts.map(a => a.id);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Alerts</h1>
          {unreadAlerts.length > 0 && (
            <Badge>{unreadAlerts.length} unread</Badge>
          )}
        </div>
        {unreadAlerts.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllRead.mutate(unreadIds)}
            disabled={markAllRead.isPending}
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      {alerts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No alerts yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {alerts.map(alert => {
            const alertType = alert.alertType ?? alert.type;
            return (
              <Card
                key={alert.id}
                className={cn(
                  'transition-colors',
                  !alert.isRead && 'border-primary/30 bg-primary/5'
                )}
              >
                <CardContent className="flex items-start gap-3 py-4">
                  <div className="mt-0.5">{getAlertIcon(alertType)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{alert.title}</span>
                      {getAlertBadge(alertType)}
                      {!alert.isRead && (
                        <span className="h-2 w-2 rounded-full bg-primary inline-block" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(alert.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!alert.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markRead.mutate(alert.id)}
                      disabled={markRead.isPending}
                    >
                      Mark read
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
