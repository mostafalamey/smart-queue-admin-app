import { useState, useEffect, useCallback } from "react";
import { getStoredUser } from "@/lib/stored-user";
import { useDepartments, useServices, useQueueData, useAggregateQueueData } from "./use-queue-data";
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
  const isAdmin = user?.role === "ADMIN";

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

  // Per-service data (used when a specific service is selected)
  const { summary: svcSummary, waitingList: svcWaitingList, loading: svcQueueLoading, error: svcError, refetch: svcRefetch } =
    useQueueData(serviceId);

  // Aggregate scope for admin:
  // - no department → "all"
  // - department selected but no service → departmentId
  const aggregateScope: "all" | string | null = (() => {
    if (!isAdmin) return null;
    if (serviceId) return null; // per-service data takes over
    if (!departmentId) return "all";
    return departmentId;
  })();

  const { summary: aggSummary, waitingList: aggWaitingList, loading: aggLoading, error: aggError, refetch: aggRefetch } =
    useAggregateQueueData(aggregateScope);

  // Active data set
  const summary = serviceId ? svcSummary : aggSummary;
  const waitingList = serviceId ? svcWaitingList : aggWaitingList;
  const queueLoading = serviceId ? svcQueueLoading : aggLoading;
  const error = serviceId ? svcError : aggError;
  const refetch = serviceId ? svcRefetch : aggRefetch;

  // Whether we currently have data to display (admin sees data without selecting a service)
  const hasActiveScope = Boolean(serviceId || aggregateScope);

  const handleDepartmentChange = (id: string) => {
    setDepartmentId(id || null);
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
              value={departmentId ?? ""}
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
              value={serviceId ?? ""}
              onValueChange={(id) => setServiceId(id || null)}
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
        {hasActiveScope && (
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
      {hasActiveScope ? (
        <div className="space-y-4">
          {/* Aggregate scope label for admin without a service selected */}
          {isAdmin && !serviceId && (
            <p className="text-xs text-muted-foreground">
              {!departmentId
                ? "Showing combined data across all departments and services."
                : "Showing combined data for all services in the selected department."}
            </p>
          )}
          <QueueSummaryCards summary={summary} loading={queueLoading} />
          {/* NowServing is station-specific; only meaningful for a single service */}
          {serviceId && (
            <NowServing
              ticket={summary?.nowServing ?? null}
              loading={queueLoading}
            />
          )}
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
