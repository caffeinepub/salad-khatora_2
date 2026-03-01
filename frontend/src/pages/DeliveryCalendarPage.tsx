import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { useSubscriptions, useMenuItems } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

function isWithinNextDays(timestamp: number, days: number): boolean {
  const now = Date.now();
  return timestamp >= now && timestamp <= now + days * 86400000;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export default function DeliveryCalendarPage() {
  const { data: subscriptions = [], isLoading } = useSubscriptions();
  const { data: menuItems = [] } = useMenuItems();
  const [daysAhead, setDaysAhead] = useState(7);

  const menuItemMap = new Map(menuItems.map(m => [m.id, m]));

  const activeSubscriptions = subscriptions.filter(s => s.status === 'active');

  const upcomingDeliveries = activeSubscriptions
    .filter(sub => isWithinNextDays(sub.nextRenewalDate, daysAhead))
    .sort((a, b) => a.nextRenewalDate - b.nextRenewalDate);

  // Group by date
  const grouped: Record<string, typeof upcomingDeliveries> = {};
  for (const sub of upcomingDeliveries) {
    const key = new Date(sub.nextRenewalDate).toISOString().split('T')[0];
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(sub);
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Delivery Calendar</h1>
            <p className="text-muted-foreground">Upcoming subscription deliveries.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDaysAhead(d => Math.max(1, d - 7))}
            disabled={daysAhead <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[80px] text-center">
            Next {daysAhead}d
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDaysAhead(d => d + 7)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {upcomingDeliveries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No deliveries scheduled in the next {daysAhead} days.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([date, subs]) => (
            <div key={date}>
              <h2 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                {new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h2>
              <div className="space-y-2">
                {subs.map(sub => {
                  const itemIds = sub.menuItemIds ?? [];
                  const items = itemIds
                    .map(id => menuItemMap.get(id))
                    .filter(Boolean);

                  return (
                    <Card key={sub.id}>
                      <CardContent className="flex items-start justify-between gap-3 py-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{sub.customerName}</span>
                            <Badge variant="outline" className="text-xs capitalize">{sub.frequency}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">{sub.planName}</p>
                          {items.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {items.map(item => item && (
                                <Badge key={item.id} variant="secondary" className="text-xs">{item.name}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-semibold text-primary">
                            ₹{(sub.totalPrice ?? sub.totalAmount).toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">{formatDate(sub.nextRenewalDate)}</p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
