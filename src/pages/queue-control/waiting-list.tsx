import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { WaitingTicket } from "./types";
import { formatWaitTime } from "./format";

interface Props {
  tickets: WaitingTicket[];
  loading: boolean;
  onSelectTicket?: (ticketId: string) => void;
}

function priorityBadge(weight: number) {
  if (weight >= 30)
    return { label: "Emergency", variant: "destructive" as const };
  if (weight >= 20) return { label: "VIP", variant: "default" as const };
  return { label: "Normal", variant: "outline" as const };
}

export function WaitingList({ tickets, loading, onSelectTicket }: Props) {
  if (loading && tickets.length === 0) {
    return (
      <Card className="p-4">
        <Skeleton className="mb-4 h-4 w-36" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="px-4 pt-4 pb-2">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Waiting Queue
          {tickets.length > 0 && (
            <span className="ml-2 text-foreground">{tickets.length}</span>
          )}
        </h3>
      </div>

      {tickets.length === 0 ? (
        <p className="px-4 pb-4 text-sm text-muted-foreground">
          No patients waiting.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">#</TableHead>
              <TableHead>Ticket</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead className="text-right">Wait Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket, idx) => {
              const { label, variant } = priorityBadge(ticket.priorityWeight);
              return (
                <TableRow
                  key={ticket.id}
                  className={onSelectTicket ? "cursor-pointer hover:bg-accent/50" : ""}
                  onClick={() => onSelectTicket?.(ticket.id)}
                >
                  <TableCell className="tabular-nums text-muted-foreground">
                    {idx + 1}
                  </TableCell>
                  <TableCell className="font-mono text-sm font-medium">
                    {ticket.ticketNumber}
                  </TableCell>
                  <TableCell>
                    <Badge variant={variant}>{label}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {formatWaitTime(ticket.createdAt)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}
