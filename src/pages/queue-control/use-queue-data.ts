import { useState, useEffect, useCallback, useRef } from "react";
import { apiJson } from "@/lib/api-client";
import type {
  Department,
  Service,
  QueueSummary,
  WaitingListResponse,
} from "./types";

const POLL_MS = 10_000;

/* ── Departments (fetched once) ─────────────────────────────────────────── */

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiJson<Department[]>("/departments")
      .then((d) => {
        if (!cancelled) setDepartments(d);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { departments, loading };
}

/* ── Services (re-fetched when department changes) ──────────────────────── */

export function useServices(departmentId: string | null) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!departmentId) {
      setServices([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    apiJson<Service[]>(
      `/departments/${encodeURIComponent(departmentId)}/services`,
    )
      .then((d) => {
        if (!cancelled) setServices(d);
      })
      .catch(() => {
        if (!cancelled) setServices([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [departmentId]);

  return { services, loading };
}

/* ── Queue data (summary + waiting list, polled every 10 s) ─────────────── */

export function useQueueData(serviceId: string | null) {
  const [summary, setSummary] = useState<QueueSummary | null>(null);
  const [waitingList, setWaitingList] = useState<WaitingListResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // True once we have received a successful response for the current serviceId;
  // background polls skip setLoading(true) to avoid re-showing skeletons.
  const hasDataRef = useRef(false);

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    if (!serviceId) {
      setSummary(null);
      setWaitingList(null);
      return;
    }

    // Only show the loading skeleton on the initial fetch, not on polls.
    if (!hasDataRef.current) setLoading(true);
    setError(null);

    try {
      const enc = encodeURIComponent(serviceId);
      const [s, w] = await Promise.all([
        apiJson<QueueSummary>(`/queue/services/${enc}/summary`, { signal }),
        apiJson<WaitingListResponse>(`/queue/services/${enc}/waiting`, { signal }),
      ]);
      setSummary(s);
      setWaitingList(w);
      hasDataRef.current = true;
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const e = err as Record<string, unknown>;
      const msg =
        (typeof e?.message === "string" && e.message) ||
        (typeof e?.error === "string" && e.error) ||
        (err instanceof Error ? err.message : "Failed to load queue data");
      setError(msg);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    // Reset so the first fetch for this serviceId always shows the skeleton.
    hasDataRef.current = false;
    const controller = new AbortController();
    fetchData(controller.signal);
    if (!serviceId) return () => controller.abort();
    const id = setInterval(() => fetchData(controller.signal), POLL_MS);
    return () => {
      controller.abort();
      clearInterval(id);
    };
  }, [fetchData, serviceId]);

  return { summary, waitingList, loading, error, refetch: fetchData };
}

/* ── Aggregate queue data (department or all) — admin use ───────────────── */

/**
 * Fetches aggregated queue data:
 * - scope === "all"  → /queue/all/summary + /queue/all/waiting (admin only)
 * - scope === string → /queue/departments/:id/summary + /queue/departments/:id/waiting
 */
export function useAggregateQueueData(scope: "all" | string | null) {
  const [summary, setSummary] = useState<QueueSummary | null>(null);
  const [waitingList, setWaitingList] = useState<WaitingListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasDataRef = useRef(false);

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    if (!scope) {
      setSummary(null);
      setWaitingList(null);
      return;
    }

    if (!hasDataRef.current) setLoading(true);
    setError(null);

    try {
      const base =
        scope === "all"
          ? "/queue/all"
          : `/queue/departments/${encodeURIComponent(scope)}`;

      const [s, w] = await Promise.all([
        apiJson<QueueSummary>(`${base}/summary`, { signal }),
        apiJson<WaitingListResponse>(`${base}/waiting`, { signal }),
      ]);
      setSummary(s);
      setWaitingList(w);
      hasDataRef.current = true;
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const e = err as Record<string, unknown>;
      const msg =
        (typeof e?.message === "string" && e.message) ||
        (typeof e?.error === "string" && e.error) ||
        (err instanceof Error ? err.message : "Failed to load queue data");
      setError(msg);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    hasDataRef.current = false;
    const controller = new AbortController();
    fetchData(controller.signal);
    if (!scope) return () => controller.abort();
    const id = setInterval(() => fetchData(controller.signal), POLL_MS);
    return () => {
      controller.abort();
      clearInterval(id);
    };
  }, [fetchData, scope]);

  return { summary, waitingList, loading, error, refetch: fetchData };
}
