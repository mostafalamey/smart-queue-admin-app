import { useState, useCallback, useRef } from "react";
import { apiJson, apiFetch } from "@/lib/api-client";
import type {
  TicketSearchResult,
  TicketDetail,
  PriorityCategory,
} from "./types";

/* ── Helpers ────────────────────────────────────────────────────────────── */

/** Extract a human-readable message from the ApiError shape thrown by apiJson. */
function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object") {
    const e = err as Record<string, unknown>;
    if (typeof e.message === "string" && e.message) return e.message;
    if (typeof e.error === "string" && e.error) return e.error;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

/* ── Ticket search ──────────────────────────────────────────────────────── */

interface SearchResponse {
  tickets: TicketSearchResult[];
}

export function useTicketSearch() {
  const [results, setResults] = useState<TicketSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const seqRef = useRef(0);

  const search = useCallback(async (q: string, serviceId?: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }

    const id = ++seqRef.current;
    setLoading(true);
    try {
      const params = new URLSearchParams({ q: q.trim() });
      if (serviceId) params.set("serviceId", serviceId);
      const data = await apiJson<SearchResponse>(
        `/admin/tickets/search?${params.toString()}`
      );
      if (id === seqRef.current) setResults(data.tickets);
    } catch (err: unknown) {
      if (id === seqRef.current) {
        console.warn("[ticket-search]", extractErrorMessage(err, "Search failed"));
        setResults([]);
      }
    } finally {
      if (id === seqRef.current) setLoading(false);
    }
  }, []);

  const clear = useCallback(() => setResults([]), []);

  return { results, loading, search, clear };
}

/* ── Ticket detail ──────────────────────────────────────────────────────── */

interface DetailResponse {
  ticket: TicketDetail;
}

export function useTicketDetail() {
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seqRef = useRef(0);

  const fetch = useCallback(async (ticketId: string) => {
    const id = ++seqRef.current;
    setLoading(true);
    setError(null);
    try {
      const data = await apiJson<DetailResponse>(
        `/admin/tickets/${encodeURIComponent(ticketId)}`
      );
      if (id === seqRef.current) setTicket(data.ticket);
    } catch (err: unknown) {
      if (id === seqRef.current) {
        setError(extractErrorMessage(err, "Failed to load ticket"));
      }
    } finally {
      if (id === seqRef.current) setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setTicket(null);
    setError(null);
  }, []);

  return { ticket, loading, error, fetch, clear };
}

/* ── Priority categories ────────────────────────────────────────────────── */

interface CategoriesResponse {
  categories: PriorityCategory[];
}

export function usePriorityCategories() {
  const [categories, setCategories] = useState<PriorityCategory[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiJson<CategoriesResponse>(
        "/admin/priority-categories"
      );
      setCategories(data.categories);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  return { categories, loading, fetch };
}

/* ── Lock / unlock / change priority ────────────────────────────────────── */

interface LockResponse {
  ticketId: string;
  lockedByUserId: string;
  lockedUntil: string;
}

export function useTicketLock() {
  const [locking, setLocking] = useState(false);

  const lock = useCallback(async (ticketId: string): Promise<LockResponse | null> => {
    setLocking(true);
    try {
      const res = await apiFetch(
        `/admin/tickets/${encodeURIComponent(ticketId)}/lock`,
        { method: "POST" }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? `Lock failed (${res.status})`);
      }

      return await res.json() as LockResponse;
    } finally {
      setLocking(false);
    }
  }, []);

  const unlock = useCallback(async (ticketId: string) => {
    await apiFetch(
      `/admin/tickets/${encodeURIComponent(ticketId)}/unlock`,
      { method: "POST" }
    );
  }, []);

  return { lock, unlock, locking };
}

export function useChangePriority() {
  const [submitting, setSubmitting] = useState(false);

  const change = useCallback(
    async (
      ticketId: string,
      priorityCategoryId: string,
      priorityWeight: number
    ) => {
      setSubmitting(true);
      try {
        const res = await apiFetch(
          `/admin/tickets/${encodeURIComponent(ticketId)}/change-priority`,
          {
            method: "POST",
            body: JSON.stringify({ priorityCategoryId, priorityWeight }),
          }
        );

        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.message ?? `Priority change failed (${res.status})`);
        }
      } finally {
        setSubmitting(false);
      }
    },
    []
  );

  return { change, submitting };
}
