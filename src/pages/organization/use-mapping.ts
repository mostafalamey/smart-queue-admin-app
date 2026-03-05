import { useState, useCallback, useRef } from "react";
import { apiJson } from "@/lib/api-client";

/* ── Types ──────────────────────────────────────────────────────────────── */

export type DeviceType = "KIOSK" | "TELLER_PC" | "SIGNAGE_PLAYER" | "LED_ADAPTER";

export interface Device {
  id: string;
  deviceId: string;
  deviceType: DeviceType;
  displayName: string | null;
  isActive: boolean;
  departmentId: string | null;
  stationId: string | null;
  department?: { id: string; nameEn: string } | null;
  station?: { id: string; counterCode: string } | null;
}

export interface Station {
  id: string;
  counterCode: string;
  isActive: boolean;
  serviceId: string;
  service?: { id: string; nameEn: string; department?: { nameEn: string } } | null;
}

export interface CreateDeviceInput {
  deviceId: string;
  deviceType: DeviceType;
  displayName?: string;
  departmentId?: string;
  stationId?: string;
}

export interface UpdateDeviceInput {
  displayName?: string;
  deviceType?: DeviceType;
  isActive?: boolean;
  departmentId?: string | null;
  stationId?: string | null;
}

export interface CreateStationInput {
  counterCode: string;
  serviceId: string;
}

export interface UpdateStationInput {
  counterCode?: string;
  serviceId?: string;
  isActive?: boolean;
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

/* ── useMapping ─────────────────────────────────────────────────────────── */

export function useMapping() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasDataRef = useRef(false);

  const fetch = useCallback(async () => {
    if (!hasDataRef.current) setLoading(true);
    setError(null);
    try {
      const [devData, stData] = await Promise.all([
        apiJson<{ devices: Device[] }>("/admin/devices"),
        apiJson<{ stations: Station[] }>("/admin/stations"),
      ]);
      setDevices(devData.devices);
      setStations(stData.stations);
      hasDataRef.current = true;
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to load mapping data"));
    } finally {
      setLoading(false);
    }
  }, []);

  /* Device mutations */

  const createDevice = useCallback(async (input: CreateDeviceInput): Promise<Device> => {
    const data = await apiJson<{ device: Device }>("/admin/devices", {
      method: "POST",
      body: JSON.stringify(input),
    });
    setDevices((prev) => [data.device, ...prev]);
    return data.device;
  }, []);

  const updateDevice = useCallback(async (id: string, input: UpdateDeviceInput): Promise<Device> => {
    const data = await apiJson<{ device: Device }>(`/admin/devices/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    setDevices((prev) => prev.map((d) => (d.id === id ? data.device : d)));
    return data.device;
  }, []);

  const deactivateDevice = useCallback(async (id: string): Promise<void> => {
    await apiJson<unknown>(`/admin/devices/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: false }),
    });
    setDevices((prev) => prev.map((d) => (d.id === id ? { ...d, isActive: false } : d)));
  }, []);

  const deleteDevice = useCallback(async (id: string): Promise<void> => {
    await apiJson<unknown>(`/admin/devices/${id}`, { method: "DELETE" });
    setDevices((prev) => prev.filter((d) => d.id !== id));
  }, []);

  /* Station mutations */

  const createStation = useCallback(async (input: CreateStationInput): Promise<Station> => {
    const data = await apiJson<{ station: Station }>("/admin/stations", {
      method: "POST",
      body: JSON.stringify(input),
    });
    setStations((prev) => [data.station, ...prev]);
    return data.station;
  }, []);

  const updateStation = useCallback(
    async (id: string, input: UpdateStationInput): Promise<Station> => {
      const data = await apiJson<{ station: Station }>(`/admin/stations/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      setStations((prev) => prev.map((s) => (s.id === id ? data.station : s)));
      return data.station;
    },
    []
  );

  const deactivateStation = useCallback(async (id: string): Promise<void> => {
    await apiJson<unknown>(`/admin/stations/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: false }),
    });
    setStations((prev) => prev.map((s) => (s.id === id ? { ...s, isActive: false } : s)));
  }, []);

  const deleteStation = useCallback(async (id: string): Promise<void> => {
    await apiJson<unknown>(`/admin/stations/${id}`, { method: "DELETE" });
    setStations((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return {
    devices,
    stations,
    loading,
    error,
    fetch,
    createDevice,
    updateDevice,
    deactivateDevice,
    deleteDevice,
    createStation,
    updateStation,
    deactivateStation,
    deleteStation,
  };
}
