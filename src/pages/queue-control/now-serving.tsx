import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { NowServingTicket } from "./types";
import { formatWaitTime } from "./format";

interface Props {
  ticket: NowServingTicket | null;
  loading: boolean;
}

export function NowServing({ ticket, loading }: Props) {
  if (loading && !ticket) {
    return (
      <Card className="p-4">
        <Skeleton className="mb-3 h-4 w-28" />
        <Skeleton className="h-8 w-52" />
      </Card>
    );
  }

  if (!ticket) {
    return (
      <Card className="p-4">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Now Serving
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          No ticket currently being served.
        </p>
      </Card>
    );
  }

  const timeRef =
    ticket.servingStartedAt ?? ticket.calledAt ?? ticket.createdAt;

  return (
    <Card className="border-primary/20 bg-primary/[0.03] p-4">
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Now Serving
      </h3>
      <div className="mt-2 flex items-center gap-3">
        <span className="text-2xl font-bold tracking-tight">
          {ticket.ticketNumber}
        </span>
        <Badge
          variant={ticket.status === "SERVING" ? "default" : "secondary"}
        >
          {ticket.status === "SERVING" ? "Serving" : "Called"}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {formatWaitTime(timeRef)} ago
        </span>
      </div>
      {ticket.patientPhone && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          Phone: {ticket.patientPhone}
        </p>
      )}
    </Card>
  );
}
