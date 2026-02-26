import React, { useState, useMemo } from 'react';
import { useUpcomingDeliveries, useCustomers, useMenuItems } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, ChevronLeft, ChevronRight, Users, Package, RefreshCw } from 'lucide-react';

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function DeliveryCalendarPage() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | undefined>(undefined);

  const { data: customers = [] } = useCustomers();
  const { data: menuItems = [] } = useMenuItems();
  const { data: deliveries = [], isLoading } = useUpcomingDeliveries(selectedCustomerId, 90);

  const goToPrevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const goToToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  };

  // Group deliveries by date string "YYYY-MM-DD"
  const deliveriesByDate = useMemo(() => {
    const map = new Map<string, typeof deliveries>();
    for (const d of deliveries) {
      const date = new Date(d.nextRenewalDate);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(d);
    }
    return map;
  }, [deliveries]);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  // Build calendar grid cells
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" />
            Delivery Calendar
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Upcoming subscription deliveries schedule</p>
        </div>

        {/* Customer Filter */}
        <div className="flex items-center gap-2">
          <Select
            value={selectedCustomerId !== undefined ? String(selectedCustomerId) : 'all'}
            onValueChange={val => setSelectedCustomerId(val === 'all' ? undefined : Number(val))}
          >
            <SelectTrigger className="w-48">
              <Users className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Customers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Customers</SelectItem>
              {customers.map(c => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Calendar Card */}
      <Card className="border-border shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-heading">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={goToPrevMonth} className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday} className="h-8 px-3 text-xs">
                <RefreshCw className="h-3 w-3 mr-1" />
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={goToNextMonth} className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          ) : (
            <>
              {/* Day headers */}
              <div className="grid grid-cols-7 mb-1">
                {DAY_NAMES.map(day => (
                  <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {cells.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} className="min-h-[80px] rounded-lg" />;
                  }

                  const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const dayDeliveries = deliveriesByDate.get(dateKey) ?? [];
                  const isToday = dateKey === todayKey;

                  return (
                    <div
                      key={dateKey}
                      className={`min-h-[80px] rounded-lg border p-1.5 transition-colors ${
                        isToday
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card hover:bg-accent/20'
                      }`}
                    >
                      <div className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'
                      }`}>
                        {day}
                      </div>

                      <div className="space-y-0.5">
                        {dayDeliveries.slice(0, 2).map(delivery => (
                          <DeliveryChip
                            key={delivery.subscriptionId}
                            delivery={delivery}
                            menuItems={menuItems}
                          />
                        ))}
                        {dayDeliveries.length > 2 && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="w-full text-left">
                                <Badge variant="outline" className="text-xs w-full justify-center cursor-pointer hover:bg-accent">
                                  +{dayDeliveries.length - 2} more
                                </Badge>
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-3" side="right">
                              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                                All Deliveries
                              </p>
                              <div className="space-y-2">
                                {dayDeliveries.map(d => (
                                  <DeliveryDetail key={d.subscriptionId} delivery={d} menuItems={menuItems} />
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{deliveries.length}</p>
                <p className="text-xs text-muted-foreground">Upcoming deliveries (90 days)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {new Set(deliveries.map(d => d.customerId)).size}
                </p>
                <p className="text-xs text-muted-foreground">Customers with deliveries</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <CalendarDays className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {deliveriesByDate.size}
                </p>
                <p className="text-xs text-muted-foreground">Days with deliveries</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface DeliveryChipProps {
  delivery: ReturnType<typeof useUpcomingDeliveries> extends { data?: infer D } ? (D extends (infer I)[] ? I : never) : never;
  menuItems: ReturnType<typeof useMenuItems> extends { data?: infer D } ? (D extends (infer I)[] ? I : never) : never[];
}

function DeliveryChip({ delivery, menuItems }: { delivery: any; menuItems: any[] }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="w-full text-left">
          <div className="bg-primary/10 border border-primary/20 rounded px-1.5 py-0.5 cursor-pointer hover:bg-primary/20 transition-colors">
            <p className="text-xs font-medium text-primary truncate leading-tight">{delivery.customerName}</p>
            <p className="text-xs text-muted-foreground truncate leading-tight">{delivery.planName}</p>
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" side="right">
        <DeliveryDetail delivery={delivery} menuItems={menuItems} />
      </PopoverContent>
    </Popover>
  );
}

function DeliveryDetail({ delivery, menuItems }: { delivery: any; menuItems: any[] }) {
  const items = delivery.menuItemIds
    .map((id: number) => menuItems.find((m: any) => m.id === id)?.name)
    .filter(Boolean);

  return (
    <div className="space-y-1.5">
      <div>
        <p className="text-sm font-semibold text-foreground">{delivery.customerName}</p>
        <p className="text-xs text-muted-foreground">{delivery.planName}</p>
      </div>
      {items.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground">Items:</p>
          <ul className="text-xs text-foreground space-y-0.5 mt-0.5">
            {items.map((name: string, i: number) => (
              <li key={i} className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-primary inline-block" />
                {name}
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Every {delivery.frequencyDays} day{delivery.frequencyDays !== 1 ? 's' : ''}
      </p>
      <p className="text-xs text-muted-foreground">
        Due: {new Date(delivery.nextRenewalDate).toLocaleDateString()}
      </p>
    </div>
  );
}
