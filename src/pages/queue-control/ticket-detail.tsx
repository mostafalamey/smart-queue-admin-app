import { useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { useTicketDetail } from "./use-ticket-ops";
import type { TicketDetail, TicketEvent } from "./types";

interface Props {
  ticketId: string | null;
  open: boolean;
  onClose: () => void;
  onStartPriorityChange: (ticket: TicketDetail) => void;
}

const statusColor: Record<string, string> = {
  WAITING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  CALLED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  SERVING: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  COMPLETED: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400",
  NO_SHOW: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
  CANCELLED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  TRANSFERRED_OUT: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

function StatusBadge({ status }: { status: string }) {
  const cls = statusColor[status] ?? "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined) return null;
  return (
    <div className="flex items-start justify-between gap-2 py-1.5">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm text-right">{value}</span>
    </div>
  );
}

function formatDateTime(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function EventRow({ event }: { event: TicketEvent }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">
            {event.eventType.replace(/_/g, " ")}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {event.actorType}
          </span>
        </div>
        <span className="text-[10px] tabular-nums text-muted-foreground">
          {formatDateTime(event.occurredAt)}
        </span>
      </div>
    </div>
  );
}

export function TicketDetailPanel({
  ticketId,
  open,
  onClose,
  onStartPriorityChange,
}: Props) {
  const { ticket, loading, error, fetch, clear } = useTicketDetail();

  useEffect(() => {
    if (ticketId && open) {
      fetch(ticketId);
    } else {
      clear();
    }
  }, [ticketId, open, fetch, clear]);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {ticket ? (
              <span className="font-mono">{ticket.ticketNumber}</span>
            ) : (
              "Ticket Detail"
            )}
          </SheetTitle>
        </SheetHeader>

        {loading && (
          <div className="space-y-4 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        )}

        {error && (
          <div className="m-4 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {ticket && !loading && (
          <div className="space-y-5 p-4">
            {/* Status + Priority */}
            <div className="flex items-center gap-2">
              <StatusBadge status={ticket.status} />
              <Badge variant="outline">
                {ticket.priorityCategory.nameEn} ({ticket.priorityWeight})
              </Badge>
            </div>

            {/* Change priority button — only for WAITING tickets */}
            {ticket.status === "WAITING" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStartPriorityChange(ticket)}
                className="w-full gap-2"
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                Change Priority
              </Button>
            )}

            <Separator />

            {/* Fields */}
            <div>
              <Field label="Ticket #" value={<span className="font-mono">{ticket.ticketNumber}</span>} />
              <Field label="Sequence" value={ticket.sequenceNumber} />
              <Field label="Phone" value={ticket.phoneNumber} />
              <Field label="Department" value={ticket.departmentName.en} />
              <Field label="Service" value={ticket.serviceName.en} />
              <Field label="Created" value={formatDateTime(ticket.createdAt)} />
              <Field label="Called" value={formatDateTime(ticket.calledAt)} />
              <Field label="Serving Started" value={formatDateTime(ticket.servingStartedAt)} />
              <Field label="Completed" value={formatDateTime(ticket.completedAt)} />
              <Field label="No-Show" value={formatDateTime(ticket.noShowAt)} />
              <Field label="Cancelled" value={formatDateTime(ticket.cancelledAt)} />
              {ticket.calledCounterStationId && (
                <Field label="Station" value={ticket.calledCounterStationId} />
              )}
              {ticket.originTicketId && (
                <Field label="Transferred From" value={<span className="font-mono text-xs">{ticket.originTicketId}</span>} />
              )}
            </div>

            {/* Audit Trail */}
            {ticket.events.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Audit Trail
                  </h4>
                  <div className="divide-y">
                    {ticket.events.map((e) => (
                      <EventRow key={e.id} event={e} />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
