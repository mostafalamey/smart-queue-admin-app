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
  Network,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  KIOSK: "bg-blue-100 text-blue-700 border-blue-200",
  TELLER_PC: "bg-green-100 text-green-700 border-green-200",
  SIGNAGE_PLAYER: "bg-purple-100 text-purple-700 border-purple-200",
  LED_ADAPTER: "bg-orange-100 text-orange-700 border-orange-200",
};

function DeviceTypeBadge({ type }: { type: DeviceType }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${DEVICE_TYPE_COLORS[type]}`}
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
  departmentId: string;
  stationId: string;
}

const emptyDevice = (): DeviceFormState => ({
  deviceId: "",
  deviceType: "KIOSK",
  displayName: "",
  departmentId: "",
  stationId: "",
});

const toDeviceForm = (d: Device): DeviceFormState => ({
  deviceId: d.deviceId,
  deviceType: d.deviceType,
  displayName: d.displayName ?? "",
  departmentId: d.departmentId ?? "",
  stationId: d.stationId ?? "",
});

interface DeviceFormDialogProps {
  open: boolean;
  editTarget: Device | null;
  departments: DeptOption[];
  onClose: () => void;
  onCreate: (input: CreateDeviceInput) => Promise<void>;
  onUpdate: (id: string, input: UpdateDeviceInput) => Promise<void>;
}

function DeviceFormDialog({
  open,
  editTarget,
  departments,
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
    setSaving(true);
    try {
      if (isCreate) {
        const input: CreateDeviceInput = {
          deviceId: form.deviceId.trim(),
          deviceType: form.deviceType,
          ...(form.displayName.trim() && { displayName: form.displayName.trim() }),
          ...(form.departmentId && { departmentId: form.departmentId }),
          ...(form.stationId && { stationId: form.stationId }),
        };
        await onCreate(input);
      } else {
        const input: UpdateDeviceInput = {
          deviceType: form.deviceType,
          displayName: form.displayName.trim() || undefined,
          departmentId: form.departmentId || null,
          stationId: form.stationId || null,
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
              <Label>Department</Label>
              <Select
                value={form.departmentId || "__none__"}
                onValueChange={(v) => set("departmentId", v === "__none__" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.nameEn}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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

  /* ── Render ─────────────────────────────────────────────────────────── */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Network className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Device & Station Mapping</h1>
            <p className="text-sm text-muted-foreground">
              Register devices and assign counter stations to services
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => void fetch()}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Refresh
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg border border-red-200 bg-red-50 text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="text-sm flex-1">{error}</span>
          <Button variant="outline" size="sm" onClick={() => void fetch()}>Retry</Button>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="devices" className="gap-1.5">
            <Monitor className="h-3.5 w-3.5" />
            Devices
            <Badge variant="secondary" className="ml-1 text-xs">{devices.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="stations" className="gap-1.5">
            <Server className="h-3.5 w-3.5" />
            Counter Stations
            <Badge variant="secondary" className="ml-1 text-xs">{stations.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* ── Devices Tab ─────────────────────────────────────────────── */}
        <TabsContent value="devices" className="mt-4">
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={() => { setEditDevice(null); setDeviceFormOpen(true); }}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Register Device
            </Button>
          </div>
          <div className="rounded-lg border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Device ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right pr-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  : devices.length === 0 && !error
                  ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                          <Monitor className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          No devices registered
                        </TableCell>
                      </TableRow>
                    )
                  : devices.map((device) => (
                      <TableRow key={device.id} className="group">
                        <TableCell>
                          <code className="text-sm font-mono">{device.deviceId}</code>
                        </TableCell>
                        <TableCell>
                          <DeviceTypeBadge type={device.deviceType} />
                        </TableCell>
                        <TableCell className="text-sm">
                          {device.displayName ?? <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-sm">
                          {device.department?.nameEn ?? <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={device.isActive}
                            disabled={togglingDeviceId === device.id}
                            onCheckedChange={() => void handleToggleDevice(device)}
                          />
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => { setEditDevice(device); setDeviceFormOpen(true); }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                                  disabled={togglingDeviceId === device.id}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Deactivate Device</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Deactivate &ldquo;{device.displayName ?? device.deviceId}&rdquo;? It will no longer be able to connect to the system.
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
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── Stations Tab ────────────────────────────────────────────── */}
        <TabsContent value="stations" className="mt-4">
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={() => { setEditStation(null); setStationFormOpen(true); }}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Create Station
            </Button>
          </div>
          <div className="rounded-lg border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Counter Code</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right pr-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 5 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  : stations.length === 0 && !error
                  ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                          <Server className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          No stations created
                        </TableCell>
                      </TableRow>
                    )
                  : stations.map((station) => (
                      <TableRow key={station.id} className="group">
                        <TableCell>
                          <code className="text-sm font-mono">{station.counterCode}</code>
                        </TableCell>
                        <TableCell className="text-sm">
                          {station.service?.nameEn ?? (
                            services.find((s) => s.id === station.serviceId)?.nameEn ?? (
                              <span className="text-muted-foreground text-xs font-mono">{station.serviceId}</span>
                            )
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {station.service?.department?.nameEn ?? (
                            services.find((s) => s.id === station.serviceId)?.departmentNameEn ?? (
                              <span className="text-muted-foreground">—</span>
                            )
                          )}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={station.isActive}
                            disabled={togglingStationId === station.id}
                            onCheckedChange={() => void handleToggleStation(station)}
                          />
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => { setEditStation(station); setStationFormOpen(true); }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                                  disabled={togglingStationId === station.id}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Deactivate Station</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Deactivate counter &ldquo;{station.counterCode}&rdquo;? Tellers assigned to this station will lose their queue access.
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
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <DeviceFormDialog
        open={deviceFormOpen}
        editTarget={editDevice}
        departments={departments}
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

