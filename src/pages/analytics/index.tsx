import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { getStoredUser } from "@/lib/stored-user";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnalyticsFiltersBar } from "./analytics-filters";
import { KPICards } from "./kpi-cards";
import { OverviewTab } from "./tabs/overview-tab";
import { StaffTab } from "./tabs/staff-tab";
import { TransfersTab } from "./tabs/transfers-tab";
import { PeaksTab } from "./tabs/peaks-tab";
import { useDashboardKPIs } from "./use-analytics-data";
import type { AnalyticsFilters } from "./types";

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function isoToday(): string {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function Analytics() {
  const user = getStoredUser();
  const isAdmin = user?.role === "ADMIN";

  const [filters, setFilters] = useState<AnalyticsFilters>({
    from: isoToday(),
    to: isoToday(),
    departmentId: user?.role === "MANAGER" ? user.departmentId : undefined,
    granularity: "daily",
  });

  const { data: kpiData, loading: kpiLoading, error: kpiError, refetch } = useDashboardKPIs(filters);

  useEffect(() => {
    if (kpiError) toast.error(kpiError);
  }, [kpiError]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-6 py-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Performance metrics and operational insights.
        </p>
      </div>

      {/* Filters */}
      <AnalyticsFiltersBar
        filters={filters}
        onFiltersChange={setFilters}
        onRefresh={handleRefresh}
      />

      {/* KPI Cards */}
      <KPICards data={kpiData} loading={kpiLoading} />

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="transfers">Transfers</TabsTrigger>
          <TabsTrigger value="peaks">Peaks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab filters={filters} isAdmin={isAdmin} />
        </TabsContent>

        <TabsContent value="staff">
          <StaffTab filters={filters} />
        </TabsContent>

        <TabsContent value="transfers">
          <TransfersTab filters={filters} />
        </TabsContent>

        <TabsContent value="peaks">
          <PeaksTab filters={filters} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
