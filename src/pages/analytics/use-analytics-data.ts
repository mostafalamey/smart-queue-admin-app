/**
 * Analytics data-fetching hooks.
 *
 * When VITE_DATA_PROVIDER=mock (or by default when the env var is unset and
 * the backend analytics endpoints are not yet available), the hooks return
 * mock data. Switch to VITE_DATA_PROVIDER=http once the backend is ready.
 *
 * Follows the same patterns as queue-control/use-queue-data.ts:
 * - apiJson<T>() for real fetches
 * - 30 s polling
 * - hasDataRef to avoid skeleton flicker on background polls
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { apiJson } from "@/lib/api-client";
import type {
  AnalyticsFilters,
  DashboardResponse,
  DepartmentComparison,
  PeakPatternCell,
  PriorityBreakdown,
  ServiceDistribution,
  StaffPerformance,
  TransferAnalytics,
  TrendPoint,
} from "./types";
import {
  mockDashboard,
  mockTrends,
  mockDepartments,
  mockServiceDistribution,
  mockStaffPerformance,
  mockTransfers,
  mockPeakPatterns,
  mockPriorityBreakdown,
} from "./mock-analytics-data";

const POLL_MS = 30_000;

const USE_MOCK =
  import.meta.env.VITE_DATA_PROVIDER === "mock";

/* ── Query string builder ────────────────────────────────────────────────── */

function qs(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(
    (e): e is [string, string] => e[1] !== undefined && e[1] !== "",
  );
  if (!entries.length) return "";
  return "?" + new URLSearchParams(entries).toString();
}

/* ── Generic polling hook factory ────────────────────────────────────────── */

interface UsePollingResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

function usePolledData<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: unknown[],
  enabled = true,
): UsePollingResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasDataRef = useRef(false);
  const refetchRef = useRef<(() => void) | null>(null);

  const stableFetcher = useCallback(fetcher, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!enabled) {
      setData(null);
      setLoading(false);
      setError(null);
      hasDataRef.current = false;
      return;
    }

    hasDataRef.current = false;
    const controller = new AbortController();

    const run = async () => {
      if (!hasDataRef.current) setLoading(true);
      setError(null);
      try {
        const result = await stableFetcher(controller.signal);
        if (!controller.signal.aborted) {
          setData(result);
          hasDataRef.current = true;
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        const e = err as Record<string, unknown>;
        const msg =
          (typeof e?.message === "string" && e.message) ||
          "Failed to load analytics data";
        if (!controller.signal.aborted) setError(msg);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    run();
    const id = setInterval(run, POLL_MS);
    refetchRef.current = () => run();

    return () => {
      controller.abort();
      clearInterval(id);
    };
  }, [stableFetcher, enabled]);

  return {
    data,
    loading,
    error,
    refetch: () => refetchRef.current?.(),
  };
}

/* ── Dashboard KPIs ──────────────────────────────────────────────────────── */

export function useDashboardKPIs(filters: AnalyticsFilters) {
  return usePolledData<DashboardResponse>(
    async (signal) => {
      if (USE_MOCK) return mockDashboard(filters);
      const q = qs({
        from: filters.from,
        to: filters.to,
        departmentId: filters.departmentId,
        serviceId: filters.serviceId,
      });
      return apiJson<DashboardResponse>(`/analytics/dashboard${q}`, { signal });
    },
    [filters.from, filters.to, filters.departmentId, filters.serviceId],
  );
}

/* ── Trends ──────────────────────────────────────────────────────────────── */

export function useTrends(filters: AnalyticsFilters) {
  return usePolledData<TrendPoint[]>(
    async (signal) => {
      if (USE_MOCK) return mockTrends(filters);
      const q = qs({
        metric: filters.metric ?? "waitTime",
        granularity: filters.granularity ?? "daily",
        from: filters.from,
        to: filters.to,
        departmentId: filters.departmentId,
        serviceId: filters.serviceId,
      });
      return apiJson<TrendPoint[]>(`/analytics/trends${q}`, { signal });
    },
    [
      filters.metric,
      filters.granularity,
      filters.from,
      filters.to,
      filters.departmentId,
      filters.serviceId,
    ],
  );
}

/* ── Department comparison ───────────────────────────────────────────────── */

export function useDepartmentComparison(
  filters: AnalyticsFilters,
  enabled: boolean,
) {
  return usePolledData<DepartmentComparison[]>(
    async (signal) => {
      if (USE_MOCK) return mockDepartments(filters);
      const q = qs({ from: filters.from, to: filters.to });
      return apiJson<DepartmentComparison[]>(`/analytics/departments${q}`, {
        signal,
      });
    },
    [filters.from, filters.to],
    enabled,
  );
}

/* ── Service distribution ────────────────────────────────────────────────── */

export function useServiceDistribution(filters: AnalyticsFilters) {
  return usePolledData<ServiceDistribution[]>(
    async (signal) => {
      if (USE_MOCK) return mockServiceDistribution(filters);
      const q = qs({
        from: filters.from,
        to: filters.to,
        departmentId: filters.departmentId,
      });
      return apiJson<ServiceDistribution[]>(
        `/analytics/service-distribution${q}`,
        { signal },
      );
    },
    [filters.from, filters.to, filters.departmentId],
  );
}

/* ── Staff performance ───────────────────────────────────────────────────── */

export function useStaffPerformance(filters: AnalyticsFilters) {
  return usePolledData<StaffPerformance[]>(
    async (signal) => {
      if (USE_MOCK) return mockStaffPerformance(filters);
      const q = qs({
        from: filters.from,
        to: filters.to,
        departmentId: filters.departmentId,
        serviceId: filters.serviceId,
      });
      return apiJson<StaffPerformance[]>(`/analytics/staff-performance${q}`, {
        signal,
      });
    },
    [
      filters.from,
      filters.to,
      filters.departmentId,
      filters.serviceId,
    ],
  );
}

/* ── Transfer analytics ──────────────────────────────────────────────────── */

export function useTransferAnalytics(filters: AnalyticsFilters) {
  return usePolledData<TransferAnalytics>(
    async (signal) => {
      if (USE_MOCK) return mockTransfers(filters);
      const q = qs({
        from: filters.from,
        to: filters.to,
        departmentId: filters.departmentId,
      });
      return apiJson<TransferAnalytics>(`/analytics/transfers${q}`, { signal });
    },
    [filters.from, filters.to, filters.departmentId],
  );
}

/* ── Peak patterns ───────────────────────────────────────────────────────── */

export function usePeakPatterns(filters: AnalyticsFilters) {
  return usePolledData<PeakPatternCell[]>(
    async (signal) => {
      if (USE_MOCK) return mockPeakPatterns(filters);
      const q = qs({
        from: filters.from,
        to: filters.to,
        departmentId: filters.departmentId,
      });
      return apiJson<PeakPatternCell[]>(`/analytics/peak-patterns${q}`, {
        signal,
      });
    },
    [filters.from, filters.to, filters.departmentId],
  );
}

/* ── Priority breakdown ──────────────────────────────────────────────────── */

export function usePriorityBreakdown(filters: AnalyticsFilters) {
  return usePolledData<PriorityBreakdown[]>(
    async (signal) => {
      if (USE_MOCK) return mockPriorityBreakdown(filters);
      const q = qs({
        from: filters.from,
        to: filters.to,
        departmentId: filters.departmentId,
      });
      return apiJson<PriorityBreakdown[]>(
        `/analytics/priority-breakdown${q}`,
        { signal },
      );
    },
    [filters.from, filters.to, filters.departmentId],
  );
}
