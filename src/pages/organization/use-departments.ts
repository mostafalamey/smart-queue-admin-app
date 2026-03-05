import { useState, useCallback, useRef } from "react";
import { apiJson } from "@/lib/api-client";

/* ── Types ──────────────────────────────────────────────────────────────── */

export interface Service {
  id: string;
  nameAr: string;
  nameEn: string;
  ticketPrefix: string;
  estimatedWaitMinutes: number;
  nearingTurnThreshold: number;
  dailyResetEnabled: boolean;
  isActive: boolean;
}

export interface Department {
  id: string;
  nameAr: string;
  nameEn: string;
  isActive: boolean;
  services: Service[];
}

export interface CreateDepartmentInput {
  nameEn: string;
  nameAr: string;
}

export interface UpdateDepartmentInput {
  nameEn?: string;
  nameAr?: string;
  isActive?: boolean;
}

export interface CreateServiceInput {
  nameEn: string;
  nameAr: string;
  ticketPrefix: string;
  estimatedWaitMinutes?: number;
  nearingTurnThreshold?: number;
  dailyResetEnabled?: boolean;
}

export interface UpdateServiceInput {
  nameEn?: string;
  nameAr?: string;
  ticketPrefix?: string;
  estimatedWaitMinutes?: number;
  nearingTurnThreshold?: number;
  dailyResetEnabled?: boolean;
  isActive?: boolean;
}

interface ListResponse {
  departments: Department[];
}

interface DeptResponse {
  department: Department;
}

interface ServiceResponse {
  service: Service;
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

/* ── useDepartments ─────────────────────────────────────────────────────── */

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasDataRef = useRef(false);

  const fetch = useCallback(async () => {
    if (!hasDataRef.current) setLoading(true);
    setError(null);
    try {
      const data = await apiJson<ListResponse>("/admin/departments");
      setDepartments(data.departments);
      hasDataRef.current = true;
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to load departments"));
    } finally {
      setLoading(false);
    }
  }, []);

  /* Department mutations */

  const createDepartment = useCallback(
    async (input: CreateDepartmentInput): Promise<Department> => {
      const data = await apiJson<DeptResponse>("/admin/departments", {
        method: "POST",
        body: JSON.stringify(input),
      });
      setDepartments((prev) => [...prev, { ...data.department, services: [] }]);
      return data.department;
    },
    []
  );

  const updateDepartment = useCallback(
    async (id: string, input: UpdateDepartmentInput): Promise<Department> => {
      const data = await apiJson<DeptResponse>(`/admin/departments/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      setDepartments((prev) =>
        prev.map((d) => (d.id === id ? { ...data.department, services: d.services } : d))
      );
      return data.department;
    },
    []
  );

  const deactivateDepartment = useCallback(async (id: string): Promise<void> => {
    await apiJson<unknown>(`/admin/departments/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: false }),
    });
    setDepartments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, isActive: false } : d))
    );
  }, []);

  const deleteDepartment = useCallback(async (id: string): Promise<void> => {
    await apiJson<unknown>(`/admin/departments/${id}`, { method: "DELETE" });
    setDepartments((prev) => prev.filter((d) => d.id !== id));
  }, []);

  /* Service mutations */

  const createService = useCallback(
    async (deptId: string, input: CreateServiceInput): Promise<Service> => {
      const data = await apiJson<ServiceResponse>(`/admin/departments/${deptId}/services`, {
        method: "POST",
        body: JSON.stringify(input),
      });
      setDepartments((prev) =>
        prev.map((d) =>
          d.id === deptId ? { ...d, services: [...d.services, data.service] } : d
        )
      );
      return data.service;
    },
    []
  );

  const updateService = useCallback(
    async (deptId: string, serviceId: string, input: UpdateServiceInput): Promise<Service> => {
      const data = await apiJson<ServiceResponse>(`/admin/services/${serviceId}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      setDepartments((prev) =>
        prev.map((d) =>
          d.id === deptId
            ? { ...d, services: d.services.map((s) => (s.id === serviceId ? data.service : s)) }
            : d
        )
      );
      return data.service;
    },
    []
  );

  const deactivateService = useCallback(
    async (deptId: string, serviceId: string): Promise<void> => {
      await apiJson<unknown>(`/admin/services/${serviceId}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: false }),
      });
      setDepartments((prev) =>
        prev.map((d) =>
          d.id === deptId
            ? { ...d, services: d.services.map((s) => (s.id === serviceId ? { ...s, isActive: false } : s)) }
            : d
        )
      );
    },
    []
  );

  const deleteService = useCallback(
    async (deptId: string, serviceId: string): Promise<void> => {
      await apiJson<unknown>(`/admin/services/${serviceId}`, { method: "DELETE" });
      setDepartments((prev) =>
        prev.map((d) =>
          d.id === deptId
            ? { ...d, services: d.services.filter((s) => s.id !== serviceId) }
            : d
        )
      );
    },
    []
  );

  return {
    departments,
    loading,
    error,
    fetch,
    createDepartment,
    updateDepartment,
    deactivateDepartment,
    deleteDepartment,
    createService,
    updateService,
    deactivateService,
    deleteService,
  };
}
