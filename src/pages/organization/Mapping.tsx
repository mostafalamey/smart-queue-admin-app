import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Monitor,
  Server,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  useMapping,
  type Device,
  type Station,
  type DeviceType,
  type CreateDeviceInput,
  type UpdateDeviceInput,
  type CreateStationInput,
  type UpdateStationInput,
  extractErrorMessage,
} from "./use-mapping";
import { apiJson } from "@/lib/api-client";

/* ── Shared types ───────────────────────────────────────────────────────── */

interface DeptOption {
  id: string;
  nameEn: string;
}

interface ServiceOption {
  id: string;
  nameEn: string;
  departmentNameEn: string;
}

/* ── Device type badge ──────────────────────────────────────────────────── */

const DEVICE_TYPE_COLORS: Record<DeviceType, string> = {
  KIOSK: "border-blue-400/20 bg-blue-400/10 text-blue-400",
  TELLER_PC: "border-emerald-400/20 bg-emerald-400/10 text-emerald-400",
  SIGNAGE_PLAYER: "border-purple-400/20 bg-purple-400/10 text-purple-400",
  LED_ADAPTER: "border-amber-400/20 bg-amber-400/10 text-amber-400",
};

function DeviceTypeBadge({ type }: { type: DeviceType }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        DEVICE_TYPE_COLORS[type]
      )}
    >
      {type.replace("_", " ")}
    </span>
  );
}

/* ── Device Form Dialog ─────────────────────────────────────────────────── */

interface DeviceFormState {
  deviceId: string;
  deviceType: DeviceType;
  displayName: string;
  assignedDepartmentId: string;
  assignedCounterStationId: string;
}

const emptyDevice = (): DeviceFormState => ({
  deviceId: "",
  deviceType: "KIOSK",
  displayName: "",
  assignedDepartmentId: "",
  assignedCounterStationId: "",
});

const toDeviceForm = (d: Device): DeviceFormState => ({
  deviceId: d.deviceId,
  deviceType: d.deviceType,
  displayName: d.displayName ?? "",
  assignedDepartmentId: d.assignedDepartmentId ?? "",
  assignedCounterStationId: d.assignedCounterStationId ?? "",
});

interface DeviceFormDialogProps {
  open: boolean;
  editTarget: Device | null;
  departments: DeptOption[];
  stations: Station[];
  onClose: () => void;
  onCreate: (input: CreateDeviceInput) => Promise<void>;
  onUpdate: (id: string, input: UpdateDeviceInput) => Promise<void>;
}

function DeviceFormDialog({
  open,
  editTarget,
  departments,
  stations,
  onClose,
  onCreate,
  onUpdate,
}: DeviceFormDialogProps) {
  const isCreate = editTarget === null;
  const [form, setForm] = useState<DeviceFormState>(emptyDevice);
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(editTarget ? toDeviceForm(editTarget) : emptyDevice());
      setFieldError(null);
    }
  }, [open, editTarget]);

  const set = (k: keyof DeviceFormState, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  async function handleSubmit() {
    if (!form.deviceId.trim()) { setFieldError("Device ID is required"); return; }
    if (form.deviceType === "TELLER_PC" && !form.assignedDepartmentId) {
      setFieldError("Department is required for Teller PC"); return;
    }
    if (form.deviceType === "TELLER_PC" && !form.assignedCounterStationId) {
      setFieldError("Counter station is required for Teller PC"); return;
    }
    setSaving(true);
    try {
      if (isCreate) {
        const input: CreateDeviceInput = {
          deviceId: form.deviceId.trim(),
          deviceType: form.deviceType,
          ...(form.displayName.trim() && { displayName: form.displayName.trim() }),
          ...(form.assignedDepartmentId && { assignedDepartmentId: form.assignedDepartmentId }),
          ...(form.assignedCounterStationId && { assignedCounterStationId: form.assignedCounterStationId }),
        };
        await onCreate(input);
      } else {
        const input: UpdateDeviceInput = {
          deviceType: form.deviceType,
          displayName: form.displayName.trim() || undefined,
          assignedDepartmentId: form.assignedDepartmentId || null,
          assignedCounterStationId: form.assignedCounterStationId || null,
        };
        await onUpdate(editTarget!.id, input);
      }
      onClose();
    } catch (err) {
      setFieldError(extractErrorMessage(err, "Save failed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            {isCreate ? "Register Device" : "Edit Device"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isCreate ? "Register a new device in the system." : "Edit device details and assignment."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>Device ID *</Label>
              <Input
                value={form.deviceId}
                onChange={(e) => set("deviceId", e.target.value)}
                placeholder="e.g. KIOSK-01"
                disabled={!isCreate}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Device Type *</Label>
              <Select
                value={form.deviceType}
                onValueChange={(v) => set("deviceType", v as DeviceType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KIOSK">Kiosk</SelectItem>
                  <SelectItem value="TELLER_PC">Teller PC</SelectItem>
                  <SelectItem value="SIGNAGE_PLAYER">Signage Player</SelectItem>
                  <SelectItem value="LED_ADAPTER">LED Adapter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Display Name</Label>
              <Input
                value={form.displayName}
                onChange={(e) => set("displayName", e.target.value)}
                placeholder="Friendly name"
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                Department
                {form.deviceType === "TELLER_PC" && <span className="text-red-400 ml-0.5">*</span>}
              </Label>
              <Select
                value={form.assignedDepartmentId || "__none__"}
                onValueChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    assignedDepartmentId: v === "__none__" ? "" : v,
                    assignedCounterStationId: "",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  {form.deviceType !== "TELLER_PC" && <SelectItem value="__none__">None</SelectItem>}
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.nameEn}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {form.deviceType === "TELLER_PC" && (
            <div className="space-y-1.5">
              <Label>
                Counter Station <span className="text-red-400">*</span>
              </Label>
              <Select
                value={form.assignedCounterStationId || "__none__"}
                onValueChange={(v) => set("assignedCounterStationId", v === "__none__" ? "" : v)}
                disabled={!form.assignedDepartmentId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      form.assignedDepartmentId
                        ? "Select counter station"
                        : "Select a department first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {stations
                    .filter((s) => s.service?.departmentId === form.assignedDepartmentId)
                    .map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        <span className="font-mono text-xs text-amber-400 mr-1.5">{s.counterCode}</span>
                        {s.service?.nameEn ?? s.serviceId}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {fieldError && (
            <p className="text-sm text-red-600 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" />
              {fieldError}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving…" : isCreate ? "Register" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Station Form Dialog ────────────────────────────────────────────────── */

interface StationFormState {
  counterCode: string;
  serviceId: string;
}

const emptyStation = (): StationFormState => ({ counterCode: "", serviceId: "" });
const toStationForm = (s: Station): StationFormState => ({
  counterCode: s.counterCode,
  serviceId: s.serviceId,
});

interface StationFormDialogProps {
  open: boolean;
  editTarget: Station | null;
  services: ServiceOption[];
  onClose: () => void;
  onCreate: (input: CreateStationInput) => Promise<void>;
  onUpdate: (id: string, input: UpdateStationInput) => Promise<void>;
}

function StationFormDialog({
  open,
  editTarget,
  services,
  onClose,
  onCreate,
  onUpdate,
}: StationFormDialogProps) {
  const isCreate = editTarget === null;
  const [form, setForm] = useState<StationFormState>(emptyStation);
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(editTarget ? toStationForm(editTarget) : emptyStation());
      setFieldError(null);
    }
  }, [open, editTarget]);

  async function handleSubmit() {
    if (!form.counterCode.trim()) { setFieldError("Counter code is required"); return; }
    if (!form.serviceId) { setFieldError("Service is required"); return; }
    setSaving(true);
    try {
      if (isCreate) {
        await onCreate({ counterCode: form.counterCode.trim(), serviceId: form.serviceId });
      } else {
        await onUpdate(editTarget!.id, {
          counterCode: form.counterCode.trim(),
          serviceId: form.serviceId,
        });
      }
      onClose();
    } catch (err) {
      setFieldError(extractErrorMessage(err, "Save failed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            {isCreate ? "Create Station" : "Edit Station"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isCreate ? "Create a new counter station and assign it to a service." : "Edit station details."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Counter Code *</Label>
            <Input
              value={form.counterCode}
              onChange={(e) => setForm((p) => ({ ...p, counterCode: e.target.value }))}
              placeholder="e.g. A-01"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Service *</Label>
            <Select
              value={form.serviceId}
              onValueChange={(v) => setForm((p) => ({ ...p, serviceId: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select service" />
              </SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="text-xs text-muted-foreground mr-1">{s.departmentNameEn} /</span>
                    {s.nameEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {fieldError && (
            <p className="text-sm text-red-600 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" />
              {fieldError}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving…" : isCreate ? "Create" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Main Page ──────────────────────────────────────────────────────────── */

export default function Mapping() {
  const {
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
  } = useMapping();

  const [departments, setDepartments] = useState<DeptOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);

  const [deviceFormOpen, setDeviceFormOpen] = useState(false);
  const [editDevice, setEditDevice] = useState<Device | null>(null);
  const [stationFormOpen, setStationFormOpen] = useState(false);
  const [editStation, setEditStation] = useState<Station | null>(null);
  const [togglingDeviceId, setTogglingDeviceId] = useState<string | null>(null);
  const [togglingStationId, setTogglingStationId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<string>(() => {
    try { return localStorage.getItem("sq:mapping_tab") ?? "devices"; } catch { return "devices"; }
  });

  function handleTabChange(tab: string) {
    setActiveTab(tab);
    try { localStorage.setItem("sq:mapping_tab", tab); } catch { /* ignore */ }
  }

  const loadReferenceData = useCallback(async () => {
    try {
      const data = await apiJson<{
        departments: Array<{ id: string; nameEn: string; services: Array<{ id: string; nameEn: string }> }>;
      }>("/admin/departments");
      setDepartments(data.departments.map((d) => ({ id: d.id, nameEn: d.nameEn })));
      const svcList: ServiceOption[] = [];
      for (const dept of data.departments) {
        for (const svc of dept.services) {
          svcList.push({ id: svc.id, nameEn: svc.nameEn, departmentNameEn: dept.nameEn });
        }
      }
      setServices(svcList);
    } catch {
      /* non-critical */
    }
  }, []);

  useEffect(() => {
    void fetch();
    void loadReferenceData();
  }, [fetch, loadReferenceData]);

  /* Device handlers */
  async function handleCreateDevice(input: CreateDeviceInput) {
    await createDevice(input);
    toast.success("Device registered");
  }

  async function handleUpdateDevice(id: string, input: UpdateDeviceInput) {
    await updateDevice(id, input);
    toast.success("Device updated");
  }

  async function handleToggleDevice(device: Device) {
    setTogglingDeviceId(device.id);
    try {
      if (device.isActive) {
        await deactivateDevice(device.id);
        toast.success("Device deactivated");
      } else {
        await updateDevice(device.id, { isActive: true });
        toast.success("Device activated");
      }
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to update device"));
    } finally {
      setTogglingDeviceId(null);
    }
  }

  /* Station handlers */
  async function handleCreateStation(input: CreateStationInput) {
    await createStation(input);
    toast.success("Station created");
  }

  async function handleUpdateStation(id: string, input: UpdateStationInput) {
    await updateStation(id, input);
    toast.success("Station updated");
  }

  async function handleToggleStation(station: Station) {
    setTogglingStationId(station.id);
    try {
      if (station.isActive) {
        await deactivateStation(station.id);
        toast.success("Station deactivated");
      } else {
        await updateStation(station.id, { isActive: true });
        toast.success("Station activated");
      }
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to update station"));
    } finally {
      setTogglingStationId(null);
    }
  }

  async function handleDeleteDevice(id: string) {
    setTogglingDeviceId(id);
    try {
      await deleteDevice(id);
      toast.success("Device deleted");
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to delete device"));
    } finally {
      setTogglingDeviceId(null);
    }
  }

  async function handleDeleteStation(id: string) {
    setTogglingStationId(id);
    try {
      await deleteStation(id);
      toast.success("Station deleted");
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to delete station"));
    } finally {
      setTogglingStationId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Device & Station Mapping</h1>
          <p className="mt-0.5 text-sm text-muted-foreground/60">
            Register devices and assign counter stations to services
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void fetch()}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Refresh
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-sm">{error}</span>
          <Button variant="outline" size="sm" onClick={() => void fetch()}>Retry</Button>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="devices" className="gap-1.5">
            <Monitor className="h-3.5 w-3.5" />
            Devices
            <span className="ml-1 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-bold">{devices.length}</span>
          </TabsTrigger>
          <TabsTrigger value="stations" className="gap-1.5">
            <Server className="h-3.5 w-3.5" />
            Counter Stations
            <span className="ml-1 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-bold">{stations.length}</span>
          </TabsTrigger>
        </TabsList>

        {/* ── Devices Tab ─────────────────────────────────────────────── */}
        <TabsContent value="devices" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => { setEditDevice(null); setDeviceFormOpen(true); }}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Register Device
            </Button>
          </div>

          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-card px-5 py-4">
                <Skeleton className="h-9 w-24 rounded-lg" />
                <Skeleton className="h-4 w-48 flex-1" />
                <Skeleton className="h-5 w-10 rounded-full" />
              </div>
            ))
          ) : devices.length === 0 && !error ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/[0.06] py-16 text-muted-foreground/30">
              <Monitor className="h-10 w-10" />
              <p className="text-sm">No devices registered</p>
            </div>
          ) : (
            devices.map((device) => (
              <div
                key={device.id}
                className={cn(
                  "flex items-center gap-4 rounded-xl border border-white/[0.08] bg-card px-5 py-4 transition-opacity",
                  !device.isActive && "opacity-50"
                )}
              >
                <DeviceTypeBadge type={device.deviceType} />
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm font-semibold">{device.deviceId}</p>
                  {device.displayName && (
                    <p className="text-xs text-muted-foreground/50 mt-0.5">{device.displayName}</p>
                  )}
                </div>
                {device.deviceType === "TELLER_PC"
                  ? device.counterStation && (
                      <span className="hidden shrink-0 items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1 text-[11px] text-muted-foreground/50 sm:flex">
                        {services.find((s) => s.id === device.counterStation!.serviceId)?.nameEn ?? device.counterStation.serviceId}
                      </span>
                    )
                  : device.department?.nameEn && (
                      <span className="hidden shrink-0 items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1 text-[11px] text-muted-foreground/50 sm:flex">
                        {device.department.nameEn}
                      </span>
                    )}
                <Switch
                  checked={device.isActive}
                  disabled={togglingDeviceId === device.id}
                  onCheckedChange={() => void handleToggleDevice(device)}
                  className="shrink-0"
                  aria-label={`Toggle active status for device ${device.displayName ?? device.deviceId}`}
                />
                <div className="flex shrink-0 items-center gap-0.5">
                  <Button
                    variant="ghost" size="icon"
                    className="h-8 w-8 text-muted-foreground/40 hover:text-foreground"
                    onClick={() => { setEditDevice(device); setDeviceFormOpen(true); }}
                    aria-label={`Edit device ${device.displayName ?? device.deviceId}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-red-400/40 hover:text-foreground"
                        disabled={togglingDeviceId === device.id}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Device</AlertDialogTitle>
                        <AlertDialogDescription>
                          Permanently delete &ldquo;{device.displayName ?? device.deviceId}&rdquo;? This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => void handleDeleteDevice(device.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))
          )}
        </TabsContent>

        {/* ── Stations Tab ────────────────────────────────────────────── */}
        <TabsContent value="stations" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => { setEditStation(null); setStationFormOpen(true); }}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Create Station
            </Button>
          </div>

          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-card px-5 py-4">
                <Skeleton className="h-9 w-12 rounded-lg" />
                <Skeleton className="h-4 w-48 flex-1" />
                <Skeleton className="h-5 w-10 rounded-full" />
              </div>
            ))
          ) : stations.length === 0 && !error ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/[0.06] py-16 text-muted-foreground/30">
              <Server className="h-10 w-10" />
              <p className="text-sm">No stations created</p>
            </div>
          ) : (
            stations.map((station) => {
              const svcName = station.service?.nameEn ?? services.find((s) => s.id === station.serviceId)?.nameEn;
              const deptName = (station.service?.departmentId
                ? departments.find((d) => d.id === station.service!.departmentId)?.nameEn
                : undefined) ?? services.find((s) => s.id === station.serviceId)?.departmentNameEn;
              return (
                <div
                  key={station.id}
                  className={cn(
                    "flex items-center gap-4 rounded-xl border border-white/[0.08] bg-card px-5 py-4 transition-opacity",
                    !station.isActive && "opacity-50"
                  )}
                >
                  <div className="flex h-9 w-14 shrink-0 items-center justify-center rounded-lg border border-amber-400/20 bg-amber-400/10">
                    <span className="font-mono text-[11px] font-bold tracking-wider text-amber-400">
                      {station.counterCode}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 flex items-baseline gap-2">
                    <p className="text-sm font-semibold shrink-0">{svcName ?? station.serviceId}</p>
                    {deptName && (
                      <>
                        <span className="text-muted-foreground/20 text-xs shrink-0">/</span>
                        <p className="text-sm text-muted-foreground/60 truncate">{deptName}</p>
                      </>
                    )}
                  </div>
                  <Switch
                    checked={station.isActive}
                    disabled={togglingStationId === station.id}
                    onCheckedChange={() => void handleToggleStation(station)}
                    className="shrink-0"
                    aria-label={`Toggle active state for counter ${station.counterCode}`}
                  />
                  <div className="flex shrink-0 items-center gap-0.5">
                    <Button
                      variant="ghost" size="icon"
                      className="h-8 w-8 text-muted-foreground/40 hover:text-foreground"
                      onClick={() => { setEditStation(station); setStationFormOpen(true); }}
                      aria-label={`Edit counter ${station.counterCode}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-red-400/40 hover:text-foreground"
                          disabled={togglingStationId === station.id}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Station</AlertDialogTitle>
                          <AlertDialogDescription>
                            Permanently delete counter &ldquo;{station.counterCode}&rdquo;? This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => void handleDeleteStation(station.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              );
            })
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <DeviceFormDialog
        open={deviceFormOpen}
        editTarget={editDevice}
        departments={departments}
        stations={stations}
        onClose={() => setDeviceFormOpen(false)}
        onCreate={handleCreateDevice}
        onUpdate={handleUpdateDevice}
      />
      <StationFormDialog
        open={stationFormOpen}
        editTarget={editStation}
        services={services}
        onClose={() => setStationFormOpen(false)}
        onCreate={handleCreateStation}
        onUpdate={handleUpdateStation}
      />
    </div>
  );
}

