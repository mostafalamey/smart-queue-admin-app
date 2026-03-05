import { useState, useEffect, useCallback } from "react";
import { getStoredUser } from "@/lib/stored-user";
import { useDepartments, useServices, useQueueData } from "./use-queue-data";
import { QueueSummaryCards } from "./queue-summary";
import { NowServing } from "./now-serving";
import { WaitingList } from "./waiting-list";
import { TicketSearch } from "./ticket-search";
import { TicketDetailPanel } from "./ticket-detail";
import { PriorityChangeDialog } from "./priority-change";
import type { TicketDetail } from "./types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw } from "lucide-react";

export default function QueueControl() {
  const user = getStoredUser();
  const isManager = user?.role === "MANAGER";

  /* ── Department / Service selection ──────────────────────────────────── */

  const { departments, loading: deptsLoading } = useDepartments();
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);

  // Manager: auto-lock to their own department
  useEffect(() => {
    if (isManager && user?.departmentId) {
      setDepartmentId(user.departmentId);
    }
  }, [isManager, user?.departmentId]);

  const { services, loading: svcLoading } = useServices(departmentId);
  const { summary, waitingList, loading: queueLoading, error, refetch } =
    useQueueData(serviceId);

  const handleDepartmentChange = (id: string) => {
    setDepartmentId(id);
    setServiceId(null);
  };

  /* ── Ticket detail panel ─────────────────────────────────────────────── */

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const openTicketDetail = useCallback((ticketId: string) => {
    setSelectedTicketId(ticketId);
    setDetailOpen(true);
  }, []);

  const closeDetail = useCallback(() => {
    setDetailOpen(false);
    setSelectedTicketId(null);
  }, []);

  /* ── Priority change dialog ──────────────────────────────────────────── */

  const [priorityTicket, setPriorityTicket] = useState<TicketDetail | null>(null);
  const [priorityOpen, setPriorityOpen] = useState(false);

  const startPriorityChange = useCallback((ticket: TicketDetail) => {
    setDetailOpen(false);
    setPriorityTicket(ticket);
    setPriorityOpen(true);
  }, []);

  const handlePrioritySuccess = useCallback(() => {
    setPriorityOpen(false);
    setPriorityTicket(null);
    refetch();
  }, [refetch]);

  /* ── Render ──────────────────────────────────────────────────────────── */

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-6 py-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Queue Control</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor live queue activity and manage patient flow.
        </p>
      </div>

      {/* Selectors Row */}
      <div className="flex flex-wrap items-end gap-3">
        {/* Department */}
        <div className="w-56">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Department
          </label>
          {deptsLoading ? (
            <Skeleton className="h-9 w-full rounded-md" />
          ) : (
            <Select
              value={departmentId ?? undefined}
              onValueChange={handleDepartmentChange}
              disabled={isManager}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {(isManager
                  ? departments.filter((d) => d.id === user?.departmentId)
                  : departments
                ).map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.nameEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Service */}
        <div className="w-56">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Service
          </label>
          {svcLoading ? (
            <Skeleton className="h-9 w-full rounded-md" />
          ) : (
            <Select
              value={serviceId ?? undefined}
              onValueChange={setServiceId}
              disabled={!departmentId || services.length === 0}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    departmentId
                      ? "Select service"
                      : "Select a department first"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {services.map((svc) => (
                  <SelectItem key={svc.id} value={svc.id}>
                    {svc.nameEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Manual refresh */}
        {serviceId && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={queueLoading}
            aria-label="Refresh queue data"
            className="shrink-0"
          >
            <RefreshCw
              className={`h-4 w-4 ${queueLoading ? "animate-spin" : ""}`}
            />
          </Button>
        )}

        {/* Ticket search — right-aligned */}
        <div className="ml-auto">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Ticket Lookup
          </label>
          <TicketSearch
            serviceId={serviceId}
            onSelectTicket={openTicketDetail}
          />
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Queue Dashboard OR empty state */}
      {serviceId ? (
        <div className="space-y-4">
          <QueueSummaryCards summary={summary} loading={queueLoading} />
          <NowServing
            ticket={summary?.nowServing ?? null}
            loading={queueLoading}
          />
          <WaitingList
            tickets={waitingList?.tickets ?? []}
            loading={queueLoading}
            onSelectTicket={openTicketDetail}
          />
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
          <p className="text-sm text-muted-foreground">
            {departmentId
              ? "Select a service to view queue status."
              : "Select a department and service to begin."}
          </p>
        </div>
      )}

      {/* Ticket detail side panel */}
      <TicketDetailPanel
        ticketId={selectedTicketId}
        open={detailOpen}
        onClose={closeDetail}
        onStartPriorityChange={startPriorityChange}
      />

      {/* Priority change dialog */}
      <PriorityChangeDialog
        ticket={priorityTicket}
        open={priorityOpen}
        onClose={() => { setPriorityOpen(false); setPriorityTicket(null); }}
        onSuccess={handlePrioritySuccess}
      />
    </div>
  );
}
