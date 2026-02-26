import { ArrowLeft, Mail, Phone, MapPin, FileText, Calendar, CalendarClock } from 'lucide-react';
import { useCustomer, useSubscriptions } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SubscriptionStatus } from '../backend';
import { cn } from '@/lib/utils';

interface CustomerDetailViewProps {
  customerId: bigint;
  onBack: () => void;
}

function statusBadge(status: SubscriptionStatus) {
  switch (status) {
    case SubscriptionStatus.active:
      return <Badge className="bg-primary/15 text-primary border-primary/30 hover:bg-primary/20">Active</Badge>;
    case SubscriptionStatus.paused:
      return <Badge className="bg-warning/15 text-warning border-warning/30 hover:bg-warning/20">Paused</Badge>;
    case SubscriptionStatus.cancelled:
      return <Badge variant="secondary" className="text-muted-foreground">Cancelled</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
}

function formatDate(ts: bigint) {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function CustomerDetailView({ customerId, onBack }: CustomerDetailViewProps) {
  const { data: customer, isLoading: customerLoading } = useCustomer(customerId);
  const { data: subscriptions, isLoading: subsLoading } = useSubscriptions(customerId);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back Button */}
      <div>
        <Button variant="ghost" onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground -ml-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Customers
        </Button>
      </div>

      {/* Customer Profile */}
      <Card className="border-border shadow-card">
        <CardHeader>
          <CardTitle className="font-heading text-xl">
            {customerLoading ? <Skeleton className="h-7 w-48" /> : customer?.name ?? 'Customer'}
          </CardTitle>
          <CardDescription>Customer profile and contact information</CardDescription>
        </CardHeader>
        <CardContent>
          {customerLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-5 w-full" />)}
            </div>
          ) : !customer ? (
            <p className="text-muted-foreground text-sm">Customer not found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow icon={Mail} label="Email" value={customer.email} />
              <InfoRow icon={Phone} label="Phone" value={customer.phone || '—'} />
              <InfoRow icon={MapPin} label="Address" value={customer.address || '—'} />
              <InfoRow icon={Calendar} label="Joined" value={formatDate(customer.createdAt)} />
              {customer.notes && (
                <div className="sm:col-span-2">
                  <InfoRow icon={FileText} label="Notes" value={customer.notes} />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscriptions */}
      <Card className="border-border shadow-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
              <CalendarClock className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-heading font-semibold">Subscriptions</CardTitle>
              <CardDescription className="text-xs">
                {subsLoading ? 'Loading...' : `${(subscriptions ?? []).length} subscription${(subscriptions ?? []).length !== 1 ? 's' : ''}`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {subsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
            </div>
          ) : !subscriptions || subscriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-2">
                <CalendarClock className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No subscriptions for this customer.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {subscriptions.map((sub) => (
                <div
                  key={sub.id.toString()}
                  className={cn(
                    'p-4 rounded-xl border transition-colors',
                    sub.status === SubscriptionStatus.active
                      ? 'border-primary/20 bg-primary/5'
                      : sub.status === SubscriptionStatus.paused
                      ? 'border-warning/20 bg-warning/5'
                      : 'border-border bg-muted/30'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-foreground text-sm">{sub.planName}</p>
                        {statusBadge(sub.status)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Every {Number(sub.frequencyDays)} day{Number(sub.frequencyDays) !== 1 ? 's' : ''}
                        {' · '}
                        Next renewal: {formatDate(sub.nextRenewalDate)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-foreground text-sm">
                        ${sub.totalPrice.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">per cycle</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm text-foreground mt-0.5 break-words">{value}</p>
      </div>
    </div>
  );
}
