import { useState, useCallback, useRef } from "react";
import { apiJson } from "@/lib/api-client";

/* ── Types ──────────────────────────────────────────────────────────────── */

export type UserRole = "ADMIN" | "IT" | "MANAGER" | "STAFF";

export interface RoleAssignment {
  id: string;
  role: UserRole;
  departmentId: string | null;
}

export interface ManagedUser {
  id: string;
  email: string;
  name: string | null;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
  roleAssignments: RoleAssignment[];
}

export interface CreateUserInput {
  email: string;
  name?: string;
  password: string;
  role: UserRole;
  departmentId?: string;
}

export interface UpdateUserInput {
  email?: string;
  name?: string;
  isActive?: boolean;
  role?: UserRole;
  departmentId?: string;
}

interface ListResponse {
  users: ManagedUser[];
}

interface SingleResponse {
  user: ManagedUser;
}

/* ── Helpers ────────────────────────────────────────────────────────────── */

export function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object") {
    const e = err as Record<string, unknown>;
    if (typeof e.message === "string" && e.message) return e.message;
    if (typeof e.error === "string" && e.error) return e.error;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

/* ── useUserManagement ──────────────────────────────────────────────────── */

export function useUserManagement() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasDataRef = useRef(false);

  const fetch = useCallback(async () => {
    if (!hasDataRef.current) setLoading(true);
    setError(null);
    try {
      const data = await apiJson<ListResponse>("/admin/users");
      setUsers(data.users);
      hasDataRef.current = true;
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to load users"));
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (input: CreateUserInput): Promise<ManagedUser> => {
    const data = await apiJson<SingleResponse>("/admin/users", {
      method: "POST",
      body: JSON.stringify(input),
    });
    setUsers((prev) => [data.user, ...prev]);
    return data.user;
  }, []);

  const update = useCallback(
    async (id: string, input: UpdateUserInput): Promise<ManagedUser> => {
      const data = await apiJson<SingleResponse>(`/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      setUsers((prev) => prev.map((u) => (u.id === id ? data.user : u)));
      return data.user;
    },
    []
  );

  const resetPassword = useCallback(
    async (id: string, newPassword: string): Promise<void> => {
      await apiJson<unknown>(`/admin/users/${id}/reset-password`, {
        method: "POST",
        body: JSON.stringify({ newPassword }),
      });
    },
    []
  );

  return { users, loading, error, fetch, create, update, resetPassword };
}
