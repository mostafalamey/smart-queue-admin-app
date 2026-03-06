import { useState, useCallback, useRef } from "react";
import { apiJson } from "@/lib/api-client";

/* ── Types ──────────────────────────────────────────────────────────────── */

export interface OrgMetadata {
  id: string;
  nameAr: string;
  nameEn: string;
  address: string | null;
  email: string | null;
  website: string | null;
  logoPath: string | null;
  timezone: string;
  updatedAt: string;
}

export interface UpdateOrgInput {
  nameAr?: string;
  nameEn?: string;
  address?: string;
  email?: string;
  website?: string;
  timezone?: string;
}

interface OrgResponse {
  organization: OrgMetadata;
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object") {
    const e = err as Record<string, unknown>;
    if (typeof e.message === "string" && e.message) return e.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

/* ── useOrgMetadata ─────────────────────────────────────────────────────── */

export function useOrgMetadata() {
  const [org, setOrg] = useState<OrgMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasDataRef = useRef(false);

  const fetch = useCallback(async () => {
    if (!hasDataRef.current) setLoading(true);
    setError(null);
    try {
      const data = await apiJson<OrgResponse>("/admin/organization");
      setOrg(data.organization);
      hasDataRef.current = true;
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to load organization details"));
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(async (input: UpdateOrgInput): Promise<OrgMetadata> => {
    const data = await apiJson<OrgResponse>("/admin/organization", {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    setOrg(data.organization);
    return data.organization;
  }, []);

  return { org, loading, error, fetch, update };
}
