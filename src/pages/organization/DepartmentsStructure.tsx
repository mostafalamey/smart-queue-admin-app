import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  Building2,
  Layers,
  Clock,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
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
  useDepartments,
  type Department,
  type Service,
  type CreateDepartmentInput,
  type UpdateDepartmentInput,
  type CreateServiceInput,
  type UpdateServiceInput,
  extractErrorMessage,
} from "./use-departments";

/* ── Department Form Dialog ─────────────────────────────────────────────── */

interface DeptFormState {
  nameEn: string;
  nameAr: string;
}

const emptyDept = (): DeptFormState => ({ nameEn: "", nameAr: "" });

interface DeptFormDialogProps {
  open: boolean;
  editTarget: Department | null;
  onClose: () => void;
  onSave: (input: CreateDepartmentInput | UpdateDepartmentInput, id?: string) => Promise<void>;
}

function DeptFormDialog({ open, editTarget, onClose, onSave }: DeptFormDialogProps) {
  const isCreate = editTarget === null;
  const [form, setForm] = useState<DeptFormState>(emptyDept);
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(editTarget ? { nameEn: editTarget.nameEn, nameAr: editTarget.nameAr } : emptyDept());
      setFieldError(null);
    }
  }, [open, editTarget]);

  async function handleSubmit() {
    if (!form.nameEn.trim()) { setFieldError("English name is required"); return; }
    if (!form.nameAr.trim()) { setFieldError("Arabic name is required"); return; }
    setSaving(true);
    try {
      await onSave({ nameEn: form.nameEn.trim(), nameAr: form.nameAr.trim() }, editTarget?.id);
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
            <Building2 className="h-4 w-4" />
            {isCreate ? "Create Department" : "Edit Department"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isCreate ? "Create a new department with Arabic and English names." : "Edit department names."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Name (English) *</Label>
            <Input value={form.nameEn} onChange={(e) => setForm((p) => ({ ...p, nameEn: e.target.value }))} placeholder="e.g. Radiology" />
          </div>
          <div className="space-y-1.5">
            <Label>Name (Arabic) *</Label>
            <Input
              value={form.nameAr}
              onChange={(e) => setForm((p) => ({ ...p, nameAr: e.target.value }))}
              placeholder="e.g. الأشعة"
              dir="rtl"
            />
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

/* ── Service Form Dialog ────────────────────────────────────────────────── */

interface ServiceFormState {
  nameEn: string;
  nameAr: string;
  ticketPrefix: string;
  estimatedWaitMinutes: string;
  nearingTurnThreshold: string;
  dailyResetEnabled: boolean;
}

const emptyService = (): ServiceFormState => ({
  nameEn: "",
  nameAr: "",
  ticketPrefix: "",
  estimatedWaitMinutes: "10",
  nearingTurnThreshold: "3",
  dailyResetEnabled: true,
});

const toServiceForm = (s: Service): ServiceFormState => ({
  nameEn: s.nameEn,
  nameAr: s.nameAr,
  ticketPrefix: s.ticketPrefix,
  estimatedWaitMinutes: String(s.estimatedWaitMinutes),
  nearingTurnThreshold: String(s.nearingTurnThreshold),
  dailyResetEnabled: s.dailyResetEnabled,
});

interface ServiceFormDialogProps {
  open: boolean;
  editTarget: Service | null;
  departmentId: string;
  onClose: () => void;
  onSave: (input: CreateServiceInput | UpdateServiceInput, serviceId?: string) => Promise<void>;
}

function ServiceFormDialog({ open, editTarget, onClose, onSave }: ServiceFormDialogProps) {
  const isCreate = editTarget === null;
  const [form, setForm] = useState<ServiceFormState>(emptyService);
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(editTarget ? toServiceForm(editTarget) : emptyService());
      setFieldError(null);
    }
  }, [open, editTarget]);

  const set = (key: keyof ServiceFormState, value: string | boolean) =>
    setForm((p) => ({ ...p, [key]: value }));

  async function handleSubmit() {
    if (!form.nameEn.trim()) { setFieldError("English name is required"); return; }
    if (!form.nameAr.trim()) { setFieldError("Arabic name is required"); return; }
    if (!form.ticketPrefix.trim()) { setFieldError("Ticket prefix is required"); return; }
    if (!/^[A-Z]{1,4}$/.test(form.ticketPrefix.trim().toUpperCase())) {
      setFieldError("Prefix must be 1–4 uppercase letters");
      return;
    }
    const wait = parseInt(form.estimatedWaitMinutes);
    const nearing = parseInt(form.nearingTurnThreshold);
    if (isNaN(wait) || wait < 1) { setFieldError("Estimated wait must be ≥ 1"); return; }
    if (isNaN(nearing) || nearing < 1) { setFieldError("Nearing threshold must be ≥ 1"); return; }
    setSaving(true);
    try {
      const input: CreateServiceInput = {
        nameEn: form.nameEn.trim(),
        nameAr: form.nameAr.trim(),
        ticketPrefix: form.ticketPrefix.trim().toUpperCase(),
        estimatedWaitMinutes: wait,
        nearingTurnThreshold: nearing,
        dailyResetEnabled: form.dailyResetEnabled,
      };
      await onSave(input, editTarget?.id);
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
            <Layers className="h-4 w-4" />
            {isCreate ? "Create Service" : "Edit Service"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isCreate ? "Create a new service for this department." : "Edit service configuration."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>Name (English) *</Label>
              <Input value={form.nameEn} onChange={(e) => set("nameEn", e.target.value)} placeholder="e.g. X-Ray Imaging" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Name (Arabic) *</Label>
              <Input value={form.nameAr} onChange={(e) => set("nameAr", e.target.value)} placeholder="e.g. التصوير بالأشعة" dir="rtl" />
            </div>
            <div className="space-y-1.5">
              <Label>Ticket Prefix *</Label>
              <Input
                value={form.ticketPrefix}
                onChange={(e) => set("ticketPrefix", e.target.value.toUpperCase())}
                placeholder="e.g. XR"
                maxLength={4}
                className="uppercase"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Est. Wait (min)</Label>
              <Input
                type="number"
                min={1}
                value={form.estimatedWaitMinutes}
                onChange={(e) => set("estimatedWaitMinutes", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Nearing Turn Threshold</Label>
              <Input
                type="number"
                min={1}
                value={form.nearingTurnThreshold}
                onChange={(e) => set("nearingTurnThreshold", e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 pt-5">
              <Switch
                checked={form.dailyResetEnabled}
                onCheckedChange={(v) => set("dailyResetEnabled", v)}
                id="daily-reset"
              />
              <Label htmlFor="daily-reset" className="cursor-pointer">Daily reset</Label>
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
            {saving ? "Saving…" : isCreate ? "Create" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Services Panel ─────────────────────────────────────────────────────── */

interface ServicesPanelProps {
  department: Department;
  onEditService: (s: Service) => void;
  onToggleService: (s: Service) => void;
  togglingServiceId: string | null;
  deactivatingServiceId: string | null;
  onAddService: () => void;
  onDeleteService: (s: Service) => void;
}

function ServicesPanel({
  department,
  onEditService,
  onToggleService,
  togglingServiceId,
  deactivatingServiceId,
  onAddService,
  onDeleteService,
}: ServicesPanelProps) {
  return (
    <div className="mx-5 mb-5 overflow-hidden rounded-xl border border-white/[0.05] bg-black/20">
      <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/50">
          Services &middot; {department.services.length}
        </span>
        <button
          onClick={onAddService}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-primary transition-colors hover:text-primary/70"
        >
          <Plus className="h-3 w-3" />
          Add Service
        </button>
      </div>

      {department.services.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground/30">
          <Layers className="h-6 w-6" />
          <span className="text-xs">No services yet</span>
        </div>
      ) : (
        <div className="divide-y divide-white/[0.04]">
          {department.services.map((s) => (
            <div
              key={s.id}
              className={cn(
                "group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-white/[0.02]",
                !s.isActive && "opacity-40"
              )}
            >
              <div className="flex h-9 w-12 shrink-0 items-center justify-center rounded-lg border border-amber-400/20 bg-amber-400/10">
                <span className="font-mono text-[11px] font-bold tracking-wider text-amber-400">
                  {s.ticketPrefix}
                </span>
              </div>
              <div className="min-w-0 flex-1 flex items-baseline gap-2">
                <p className="text-sm font-semibold shrink-0 leading-tight">{s.nameEn}</p>
                <span className="text-muted-foreground/20 text-xs shrink-0">/</span>
                <p className="text-sm text-muted-foreground/60 truncate" dir="rtl">
                  {s.nameAr}
                </p>
              </div>
              <div className="hidden shrink-0 items-center gap-2.5 md:flex">
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground/50">
                  <Clock className="h-3 w-3" />
                  {s.estimatedWaitMinutes}m
                </span>
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                    s.dailyResetEnabled
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                      : "border-white/[0.05] bg-white/[0.02] text-muted-foreground/30"
                  )}
                >
                  {s.dailyResetEnabled ? "Daily" : "Off"}
                </span>
              </div>
              <Switch
                checked={s.isActive}
                disabled={togglingServiceId === s.id}
                onCheckedChange={() => onToggleService(s)}
                aria-label={s.isActive ? "Deactivate service" : "Activate service"}
                className="shrink-0"
              />
              <div className="flex shrink-0 items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground/40 hover:text-foreground"
                  onClick={() => onEditService(s)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-400/40 hover:text-foreground"
                      disabled={deactivatingServiceId === s.id || togglingServiceId === s.id}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Service</AlertDialogTitle>
                      <AlertDialogDescription>
                        Permanently delete &ldquo;{s.nameEn}&rdquo;? This cannot be undone. If this
                        service has existing tickets, use the toggle to deactivate it instead.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => onDeleteService(s)}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Department Card ────────────────────────────────────────────────────── */

interface DepartmentCardProps {
  dept: Department;
  expanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
  togglingDeptId: string | null;
  deactivatingDeptId: string | null;
  onEditService: (s: Service) => void;
  onToggleService: (s: Service) => void;
  togglingServiceId: string | null;
  deactivatingServiceId: string | null;
  onAddService: () => void;
  onDeleteService: (s: Service) => void;
}

function DepartmentCard({
  dept,
  expanded,
  onToggleExpand,
  onEdit,
  onToggleActive,
  onDelete,
  togglingDeptId,
  deactivatingDeptId,
  onEditService,
  onToggleService,
  togglingServiceId,
  deactivatingServiceId,
  onAddService,
  onDeleteService,
}: DepartmentCardProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border transition-all duration-200",
        dept.isActive
          ? "border-white/[0.08] bg-card"
          : "border-white/[0.04] bg-card/60 opacity-60"
      )}
    >
      <div
        className="flex cursor-pointer select-none items-center gap-4 px-5 py-4"
        onClick={onToggleExpand}
      >
        <ChevronRight
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground/30 transition-transform duration-200",
            expanded && "rotate-90 text-primary/60"
          )}
        />
        <div
          className={cn(
            "h-9 w-0.5 shrink-0 rounded-full transition-colors duration-200",
            dept.isActive ? "bg-primary/50" : "bg-muted/20"
          )}
        />
        <div className="min-w-0 flex-1 flex items-baseline gap-2">
          <p className="text-sm font-bold shrink-0 leading-tight">{dept.nameEn}</p>
          <span className="text-muted-foreground/20 text-xs shrink-0">/</span>
          <p className="text-sm text-muted-foreground/60 truncate" dir="rtl">
            {dept.nameAr}
          </p>
        </div>
        <div className="hidden shrink-0 items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1 sm:flex">
          <Layers className="h-3 w-3 text-muted-foreground/30" />
          <span className="text-[11px] font-medium text-muted-foreground/50">
            {dept.services.length} {dept.services.length === 1 ? "service" : "services"}
          </span>
        </div>
        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={dept.isActive}
            disabled={togglingDeptId === dept.id}
            onCheckedChange={onToggleActive}
            aria-label={dept.isActive ? "Deactivate department" : "Activate department"}
          />
        </div>
        <div
          className="flex shrink-0 items-center gap-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground/40 hover:text-foreground"
            onClick={onEdit}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-400/40 hover:text-foreground"
                disabled={deactivatingDeptId === dept.id || togglingDeptId === dept.id}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Department</AlertDialogTitle>
                <AlertDialogDescription>
                  Permanently delete &ldquo;{dept.nameEn}&rdquo; and all its services? This cannot
                  be undone. If this department has existing tickets, use the toggle to deactivate
                  it instead.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={onDelete}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      {expanded && (
        <ServicesPanel
          department={dept}
          onEditService={onEditService}
          onToggleService={onToggleService}
          togglingServiceId={togglingServiceId}
          deactivatingServiceId={deactivatingServiceId}
          onAddService={onAddService}
          onDeleteService={onDeleteService}
        />
      )}
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────────────────── */

export default function DepartmentsStructure() {
  const {
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
  } = useDepartments();

  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem("sq:dept_expanded");
      return raw ? new Set(JSON.parse(raw) as string[]) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });
  const [deptFormOpen, setDeptFormOpen] = useState(false);
  const [editDept, setEditDept] = useState<Department | null>(null);
  const [serviceFormOpen, setServiceFormOpen] = useState(false);
  const [editService, setEditService] = useState<Service | null>(null);
  const [activeDeptId, setActiveDeptId] = useState<string | null>(null);
  const [togglingDeptId, setTogglingDeptId] = useState<string | null>(null);
  const [togglingServiceId, setTogglingServiceId] = useState<string | null>(null);
  const [deactivatingDeptId, setDeactivatingDeptId] = useState<string | null>(null);
  const [deactivatingServiceId, setDeactivatingServiceId] = useState<string | null>(null);

  useEffect(() => { void fetch(); }, [fetch]);

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      try { localStorage.setItem("sq:dept_expanded", JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  }

  async function handleDeptSave(
    input: CreateDepartmentInput | UpdateDepartmentInput,
    id?: string
  ) {
    if (id) {
      await updateDepartment(id, input as UpdateDepartmentInput);
      toast.success("Department updated");
    } else {
      await createDepartment(input as CreateDepartmentInput);
      toast.success("Department created");
    }
  }

  async function handleToggleDept(dept: Department) {
    setTogglingDeptId(dept.id);
    try {
      if (dept.isActive) {
        await deactivateDepartment(dept.id);
        toast.success("Department deactivated");
      } else {
        await updateDepartment(dept.id, { isActive: true });
        toast.success("Department activated");
      }
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to update department"));
    } finally {
      setTogglingDeptId(null);
    }
  }

  async function handleServiceSave(
    input: CreateServiceInput | UpdateServiceInput,
    serviceId?: string
  ) {
    if (!activeDeptId) return;
    if (serviceId) {
      await updateService(activeDeptId, serviceId, input as UpdateServiceInput);
      toast.success("Service updated");
    } else {
      await createService(activeDeptId, input as CreateServiceInput);
      toast.success("Service created");
    }
  }

  async function handleToggleService(dept: Department, service: Service) {
    setTogglingServiceId(service.id);
    try {
      if (service.isActive) {
        await deactivateService(dept.id, service.id);
        toast.success("Service deactivated");
      } else {
        await updateService(dept.id, service.id, { isActive: true });
        toast.success("Service activated");
      }
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to update service"));
    } finally {
      setTogglingServiceId(null);
    }
  }

  async function handleDeleteDept(id: string) {
    setDeactivatingDeptId(id);
    try {
      await deleteDepartment(id);
      toast.success("Department deleted");
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to delete department"));
    } finally {
      setDeactivatingDeptId(null);
    }
  }

  async function handleDeleteService(deptId: string, serviceId: string) {
    setDeactivatingServiceId(serviceId);
    try {
      await deleteService(deptId, serviceId);
      toast.success("Service deleted");
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to delete service"));
    } finally {
      setDeactivatingServiceId(null);
    }
  }

  function openAddService(deptId: string) {
    setActiveDeptId(deptId);
    setEditService(null);
    setServiceFormOpen(true);
  }

  function openEditService(deptId: string, service: Service) {
    setActiveDeptId(deptId);
    setEditService(service);
    setServiceFormOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Departments & Services</h1>
          <p className="mt-0.5 text-sm text-muted-foreground/60">
            Manage department structure and their queuing services
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void fetch()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditDept(null);
              setDeptFormOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Department
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-sm">{error}</span>
          <Button variant="outline" size="sm" onClick={() => void fetch()}>
            Retry
          </Button>
        </div>
      )}

      {/* Department cards */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-card px-5 py-4"
            >
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-9 w-0.5 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-5 w-10 rounded-full" />
            </div>
          ))
        ) : departments.length === 0 && !error ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/[0.06] py-16 text-muted-foreground/30">
            <Building2 className="h-10 w-10" />
            <p className="text-sm">No departments yet</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-1"
              onClick={() => {
                setEditDept(null);
                setDeptFormOpen(true);
              }}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add your first department
            </Button>
          </div>
        ) : (
          departments.map((dept) => (
            <DepartmentCard
              key={dept.id}
              dept={dept}
              expanded={expandedIds.has(dept.id)}
              onToggleExpand={() => toggleExpand(dept.id)}
              onEdit={() => {
                setEditDept(dept);
                setDeptFormOpen(true);
              }}
              onToggleActive={() => void handleToggleDept(dept)}
              onDelete={() => void handleDeleteDept(dept.id)}
              togglingDeptId={togglingDeptId}
              deactivatingDeptId={deactivatingDeptId}
              onEditService={(s) => openEditService(dept.id, s)}
              onToggleService={(s) => void handleToggleService(dept, s)}
              togglingServiceId={togglingServiceId}
              deactivatingServiceId={deactivatingServiceId}
              onAddService={() => openAddService(dept.id)}
              onDeleteService={(s) => void handleDeleteService(dept.id, s.id)}
            />
          ))
        )}
      </div>

      <DeptFormDialog
        open={deptFormOpen}
        editTarget={editDept}
        onClose={() => setDeptFormOpen(false)}
        onSave={handleDeptSave}
      />
      <ServiceFormDialog
        open={serviceFormOpen}
        editTarget={editService}
        departmentId={activeDeptId ?? ""}
        onClose={() => setServiceFormOpen(false)}
        onSave={handleServiceSave}
      />
    </div>
  );
}

