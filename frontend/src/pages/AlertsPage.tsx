import React from 'react';
import { useAlerts, useMarkAlertRead, useMarkAllAlertsRead, AlertType } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, AlertTriangle, Calendar, Package, CalendarX, CheckCheck, Check } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AlertsPage() {
  const { data: alerts = [], isLoading } = useAlerts();
  const markRead = useMarkAlertRead();
  const markAllRead = useMarkAllAlertsRead();

  const unreadCount = alerts.filter(a => !a.isRead).length;

  const getAlertIcon = (type: string) => {
    switch (type) {
      case AlertType.lowStock:
        return <Package className="h-5 w-5 text-orange-500" />;
      case AlertType.subscriptionRenewal:
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case AlertType.expiryWarning:
        return <CalendarX className="h-5 w-5 text-orange-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getAlertBadge = (type: string) => {
    switch (type) {
      case AlertType.lowStock:
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Low Stock</Badge>;
      case AlertType.subscriptionRenewal:
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Renewal</Badge>;
      case AlertType.expiryWarning:
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Expiry Warning</Badge>;
      default:
        return <Badge variant="outline">Other</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Alerts</h1>
          {unreadCount > 0 && (
            <Badge className="bg-red-500 text-white">{unreadCount} unread</Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark All Read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : alerts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No alerts at this time.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => (
            <Card key={alert.id} className={alert.isRead ? 'opacity-60' : ''}>
              <CardContent className="flex items-start gap-4 pt-4">
                <div className="mt-0.5">{getAlertIcon(alert.alertType)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getAlertBadge(alert.alertType)}
                    {!alert.isRead && (
                      <span className="inline-block w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="text-sm">{alert.message}</p>
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
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
