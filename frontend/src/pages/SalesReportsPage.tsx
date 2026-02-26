import { useState } from 'react';
import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useSalesReport } from '../hooks/useQueries';
import {
  BarChart2, Download, Calendar, TrendingUp, ShoppingBag, DollarSign, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

function formatCurrency(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
}

type ReportPeriod = 'daily' | 'weekly';

export default function SalesReportsPage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();

  useEffect(() => {
    if (!identity) navigate({ to: '/login' });
  }, [identity, navigate]);

  const [period, setPeriod] = useState<ReportPeriod>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const referenceDate = selectedDate ? new Date(selectedDate) : null;
  const { data: report, isLoading, isError, error } = useSalesReport(period, referenceDate);

  const handleDownloadCSV = () => {
    if (!report) return;

    const rows: string[] = [];
    rows.push('Sales Report');
    rows.push(`Period,"${report.periodLabel}"`);
    rows.push(`Total Orders,${report.totalOrdersCount.toString()}`);
    rows.push(`Total Revenue,${report.totalRevenue.toFixed(2)}`);
    rows.push(`Average Order Value,${report.averageOrderValue.toFixed(2)}`);
    rows.push('');
    rows.push('Top Selling Items');
    rows.push('Item Name,Quantity Sold,Revenue');
    for (const item of report.topSellingItems) {
      rows.push(`"${item.menuItemName}",${item.quantitySold.toString()},${item.revenue.toFixed(2)}`);
    }

    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales-report-${report.periodLabel.replace(/\s+/g, '-')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Sales Reports</h1>
        <p className="text-muted-foreground text-sm mt-0.5">View daily and weekly revenue summaries</p>
      </div>

      {/* Controls */}
      <Card className="border-border shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <CardTitle className="text-base font-heading font-semibold">Report Settings</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="space-y-1.5">
              <Label>Report Period</Label>
              <div className="flex gap-2">
                {(['daily', 'weekly'] as ReportPeriod[]).map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium border transition-colors capitalize',
                      period === p
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:text-foreground hover:bg-accent'
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="report-date">
                {period === 'daily' ? 'Select Date' : 'Week Starting Date'}
              </Label>
              <Input
                id="report-date"
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-48"
              />
            </div>
            {report && (
              <Button onClick={handleDownloadCSV} variant="outline" className="gap-2 ml-auto">
                <Download className="w-4 h-4" />
                Download CSV
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : isError ? (
        <Card className="border-destructive/30">
          <CardContent className="py-8 text-center">
            <p className="text-destructive text-sm">
              {error instanceof Error ? error.message : 'Failed to load report'}
            </p>
          </CardContent>
        </Card>
      ) : report ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border shadow-card">
              <CardContent className="pt-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Period</p>
                    <p className="font-semibold text-foreground text-sm">{report.periodLabel}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-card">
              <CardContent className="pt-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Total Orders</p>
                    <p className="font-bold text-2xl text-foreground">{report.totalOrdersCount.toString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-card">
              <CardContent className="pt-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Total Revenue</p>
                    <p className="font-bold text-2xl text-foreground">{formatCurrency(report.totalRevenue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-card">
              <CardContent className="pt-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Avg Order Value</p>
                    <p className="font-bold text-2xl text-foreground">{formatCurrency(report.averageOrderValue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Selling Items */}
          <Card className="border-border shadow-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                    <BarChart2 className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-heading font-semibold">Top Selling Items</CardTitle>
                    <CardDescription className="text-xs">Sorted by quantity sold</CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">{report.topSellingItems.length} items</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {report.topSellingItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <BarChart2 className="w-10 h-10 text-muted-foreground mb-3" />
                  <p className="font-medium text-foreground text-sm">No sales data for this period</p>
                  <p className="text-muted-foreground text-xs mt-1">Try selecting a different date or period.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rank</th>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Item Name</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Qty Sold</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.topSellingItems.map((item, idx) => (
                        <tr key={item.menuItemId.toString()} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                          <td className="py-3 px-3">
                            <span className={cn(
                              'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                              idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                              idx === 1 ? 'bg-gray-100 text-gray-600' :
                              idx === 2 ? 'bg-orange-100 text-orange-600' :
                              'bg-secondary text-muted-foreground'
                            )}>
                              {idx + 1}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-medium text-foreground">{item.menuItemName}</td>
                          <td className="py-3 px-3 text-right font-semibold text-foreground">{item.quantitySold.toString()}</td>
                          <td className="py-3 px-3 text-right font-semibold text-primary">{formatCurrency(item.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="border-border">
          <CardContent className="py-12 text-center">
            <BarChart2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium text-foreground text-sm">Select a date to generate a report</p>
            <p className="text-muted-foreground text-xs mt-1">Choose a period and date above to view sales data.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
