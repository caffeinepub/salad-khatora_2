import React, { useState } from 'react';
import { useUpcomingDeliveries, useCustomers, useMenuItems } from '../hooks/useQueries';
import type { UpcomingDelivery, MenuItem } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Package, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

interface DeliveryDetailProps {
  delivery: UpcomingDelivery;
  menuItems: MenuItem[];
}

function DeliveryDetail({ delivery, menuItems }: DeliveryDetailProps) {
  const itemNames = delivery.menuItemIds
    .map(id => menuItems.find(m => m.id === id)?.name ?? `Item #${id}`)
    .join(', ');

  return (
    <div className="p-3 rounded-lg border border-border bg-card space-y-1">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{delivery.planName}</p>
        <Badge variant="secondary" className="text-xs">
          Every {delivery.frequencyDays}d
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">{itemNames || 'No items'}</p>
      <p className="text-xs text-primary font-medium">Due: {formatDate(delivery.nextRenewalDate)}</p>
    </div>
  );
}

export default function DeliveryCalendarPage() {
  const { data: deliveries = [], isLoading } = useUpcomingDeliveries();
  const { data: customers = [] } = useCustomers();
  const { data: menuItems = [] } = useMenuItems();

  const customerMap = new Map(customers.map(c => [c.id.toString(), c.name]));

  // Group deliveries by date
  const grouped = deliveries.reduce<Record<string, UpcomingDelivery[]>>((acc, d) => {
    const key = formatDate(d.nextRenewalDate);
    if (!acc[key]) acc[key] = [];
    acc[key].push(d);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => {
    const da = grouped[a][0].nextRenewalDate;
    const db = grouped[b][0].nextRenewalDate;
    return da - db;
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Delivery Calendar</h1>
        <p className="text-muted-foreground text-sm mt-1">Upcoming subscription deliveries for the next 7 days</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : deliveries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="font-medium text-foreground">No upcoming deliveries</p>
            <p className="text-muted-foreground text-sm mt-1">Active subscriptions with renewals in the next 7 days will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedDates.map(date => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-3">
                <CalendarDays className="w-4 h-4 text-primary" />
                <h2 className="text-base font-semibold text-foreground">{date}</h2>
                <Badge variant="secondary">{grouped[date].length} delivery{grouped[date].length !== 1 ? 'ies' : ''}</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {grouped[date].map(d => (
                  <DeliveryDetail key={d.subscriptionId} delivery={d} menuItems={menuItems} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
