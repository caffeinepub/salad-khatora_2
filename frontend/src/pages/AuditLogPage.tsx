import React, { useState } from 'react';
import { Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuditLogs } from '@/hooks/useQueries';
import type { AuditLog } from '../backend';

const PAGE_SIZE = 20;

function truncatePrincipal(p: string): string {
  if (p.length <= 16) return p;
  return p.slice(0, 8) + '...' + p.slice(-6);
}

function formatTimestamp(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleString();
}

function getActionBadgeColor(action: string): string {
  if (action.startsWith('create')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  if (action.startsWith('update')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  if (action.startsWith('delete')) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  if (action.startsWith('toggle')) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
}

export default function AuditLogPage() {
  const [offset, setOffset] = useState(0);
  const [allLogs, setAllLogs] = useState<AuditLog[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const { data: logs, isLoading, isFetching } = useAuditLogs(PAGE_SIZE, offset);

  // Accumulate logs as we load more
  React.useEffect(() => {
    if (logs && logs.length > 0) {
      if (offset === 0) {
        setAllLogs(logs);
      } else {
        setAllLogs(prev => {
          const existingIds = new Set(prev.map(l => l.id.toString()));
          const newLogs = logs.filter(l => !existingIds.has(l.id.toString()));
          return [...prev, ...newLogs];
        });
      }
      if (logs.length < PAGE_SIZE) {
        setHasMore(false);
      }
    } else if (logs && logs.length === 0 && offset > 0) {
      setHasMore(false);
    }
  }, [logs, offset]);

  const loadMore = () => {
    setOffset(prev => prev + PAGE_SIZE);
  };

  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Activity Log</h1>
          <p className="text-muted-foreground text-sm mt-1">Track all system changes and actions</p>
        </div>

        {isLoading && offset === 0 ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target Type</TableHead>
                    <TableHead>Target ID</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                        No activity logs yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    allLogs.map(log => (
                      <TableRow key={log.id.toString()}>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatTimestamp(log.timestamp)}
                        </TableCell>
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="font-mono text-xs cursor-default text-muted-foreground">
                                {truncatePrincipal(log.actorPrincipal)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-mono text-xs">{log.actorPrincipal}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Badge className={`border-0 text-xs ${getActionBadgeColor(log.action)}`}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{log.targetType}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {log.targetId !== undefined && log.targetId !== null ? log.targetId.toString() : '—'}
                        </TableCell>
                        <TableCell className="text-sm max-w-xs truncate" title={log.details}>
                          {log.details}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {hasMore && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={isFetching}
                  className="gap-2"
                >
                  {isFetching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                  Load More
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
