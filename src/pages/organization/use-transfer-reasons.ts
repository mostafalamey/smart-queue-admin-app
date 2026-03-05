import { useState, useCallback, useRef } from "react";
import { apiJson } from "@/lib/api-client";

/* ── Types ──────────────────────────────────────────────────────────────── */

export interface TransferReason {
  id: string;
  nameEn: string;
  nameAr: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransferReasonInput {
  nameEn: string;
  nameAr: string;
  sortOrder: number;
  isActive: boolean;
}

export interface UpdateTransferReasonInput {
  nameEn?: string;
  nameAr?: string;
  sortOrder?: number;
  isActive?: boolean;
}

interface ListResponse {
  reasons: TransferReason[];
}

interface SingleResponse {
  reason: TransferReason;
}

/* ── Helpers ────────────────────────────────────────────────────────────── */

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object") {
    const e = err as Record<string, unknown>;
    if (typeof e.message === "string" && e.message) return e.message;
    if (typeof e.error === "string" && e.error) return e.error;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

/* ── useTransferReasons ─────────────────────────────────────────────────── */

export function useTransferReasons() {
  const [reasons, setReasons] = useState<TransferReason[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasDataRef = useRef(false);

  const fetch = useCallback(async () => {
    if (!hasDataRef.current) setLoading(true);
    setError(null);
    try {
      const data = await apiJson<ListResponse>("/admin/transfer-reasons");
      setReasons(data.reasons);
      hasDataRef.current = true;
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to load transfer reasons"));
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(
    async (input: CreateTransferReasonInput): Promise<TransferReason> => {
      const data = await apiJson<SingleResponse>("/admin/transfer-reasons", {
        method: "POST",
        body: JSON.stringify(input),
      });
      setReasons((prev) =>
        [...prev, data.reason].sort((a, b) => a.sortOrder - b.sortOrder)
      );
      return data.reason;
    },
    []
  );

  const update = useCallback(
    async (id: string, input: UpdateTransferReasonInput): Promise<TransferReason> => {
      const data = await apiJson<SingleResponse>(
        `/admin/transfer-reasons/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          body: JSON.stringify(input),
        }
      );
      setReasons((prev) =>
        prev
          .map((r) => (r.id === id ? data.reason : r))
          .sort((a, b) => a.sortOrder - b.sortOrder)
      );
      return data.reason;
    },
    []
  );

  const deactivate = useCallback(async (id: string): Promise<void> => {
    await apiJson<SingleResponse>(
      `/admin/transfer-reasons/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: JSON.stringify({ isActive: false }),
      }
    );
    setReasons((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: false } : r))
    );
  }, []);

  const deleteReason = useCallback(async (id: string): Promise<void> => {
    await apiJson<{ success: boolean }>(
      `/admin/transfer-reasons/${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
    setReasons((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return { reasons, loading, error, fetch, create, update, deactivate, deleteReason };
}
