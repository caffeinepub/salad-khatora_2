import { useState } from "react";
import { ScrollText, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuditLogs } from "../hooks/useQueries";

const actionColors: Record<string, string> = {
  create: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  update: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  delete: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  toggle: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
};

function getActionColor(action: string): string {
  const lower = action.toLowerCase();
  for (const [key, cls] of Object.entries(actionColors)) {
    if (lower.includes(key)) return cls;
  }
  return "bg-muted text-muted-foreground";
}

const PAGE_SIZE = 20;

export default function AuditLogPage() {
  const [page, setPage] = useState(0);
  const { data: logs = [], isLoading, isFetching } = useAuditLogs(PAGE_SIZE, page * PAGE_SIZE);

  const hasMore = logs.length === PAGE_SIZE;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
          <ScrollText size={24} className="text-primary" />
          Activity Log
        </h1>
        <p className="text-muted-foreground mt-1">
          Audit trail of all system actions.
        </p>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="animate-spin text-primary" size={28} />
        </div>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ScrollText size={40} className="text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No activity recorded yet.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id.toString()}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(Number(log.timestamp) / 1_000_000).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-muted-foreground">
                        {log.actorPrincipal.length > 12
                          ? `${log.actorPrincipal.slice(0, 8)}...`
                          : log.actorPrincipal}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getActionColor(log.action)}`}
                      >
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="text-foreground">{log.targetType}</span>
                      {log.targetId !== undefined && log.targetId !== null && (
                        <span className="text-muted-foreground ml-1">#{log.targetId.toString()}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {log.details}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {page * PAGE_SIZE + 1}–{page * PAGE_SIZE + logs.length} entries
            </p>
            <div className="flex gap-2">
              {page > 0 && (
                <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
              )}
              {hasMore && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={isFetching}
                >
                  {isFetching ? (
                    <Loader2 size={14} className="animate-spin mr-1" />
                  ) : (
                    <ChevronDown size={14} className="mr-1" />
                  )}
                  Load More
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
