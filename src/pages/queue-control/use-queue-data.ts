import { useState, useEffect, useCallback } from "react";
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

  const fetchData = useCallback(async () => {
    if (!serviceId) {
      setSummary(null);
      setWaitingList(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const enc = encodeURIComponent(serviceId);
      const [s, w] = await Promise.all([
        apiJson<QueueSummary>(`/queue/services/${enc}/summary`),
        apiJson<WaitingListResponse>(`/queue/services/${enc}/waiting`),
      ]);
      setSummary(s);
      setWaitingList(w);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to load queue data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    fetchData();
    if (!serviceId) return;
    const id = setInterval(fetchData, POLL_MS);
    return () => clearInterval(id);
  }, [fetchData, serviceId]);

  return { summary, waitingList, loading, error, refetch: fetchData };
}
