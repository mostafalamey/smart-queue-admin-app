import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  ChevronDown,
  Building2,
  Layers,
  RefreshCw,
  AlertCircle,
  ToggleLeft,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

/* ── Services sub-table ─────────────────────────────────────────────────── */

interface ServicesTableProps {
  department: Department;
  onEditService: (s: Service) => void;
  onToggleService: (s: Service) => void;
  togglingServiceId: string | null;
  deactivatingServiceId: string | null;
  onAddService: () => void;
  onDeactivateService: (s: Service) => void;
}

function ServicesTable({
  department,
  onEditService,
  onToggleService,
  togglingServiceId,
  deactivatingServiceId,
  onAddService,
  onDeactivateService,
}: ServicesTableProps) {
  return (
    <div className="ml-8 mt-2 mb-3 rounded-md border border-dashed border-border/60 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-muted/30">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Services ({department.services.length})
        </span>
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={onAddService}>
          <Plus className="h-3 w-3" />
          Add Service
        </Button>
      </div>
      {department.services.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No services yet</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/20 hover:bg-muted/20">
              <TableHead className="text-xs">Name</TableHead>
              <TableHead className="text-xs">Prefix</TableHead>
              <TableHead className="text-xs">Est. Wait</TableHead>
              <TableHead className="text-xs">Daily Reset</TableHead>
              <TableHead className="text-xs">Active</TableHead>
              <TableHead className="text-right pr-4 text-xs">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {department.services.map((s) => (
              <TableRow key={s.id} className="group">
                <TableCell>
                  <div className="text-sm font-medium">{s.nameEn}</div>
                  <div className="text-xs text-muted-foreground" dir="rtl">{s.nameAr}</div>
                </TableCell>
                <TableCell>
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{s.ticketPrefix}</code>
                </TableCell>
                <TableCell className="text-sm">{s.estimatedWaitMinutes} min</TableCell>
                <TableCell>
                  {s.dailyResetEnabled ? (
                    <Badge variant="outline" className="text-xs text-green-600 border-green-300 bg-green-50">On</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">Off</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={s.isActive}
                    disabled={togglingServiceId === s.id}
                    onCheckedChange={() => onToggleService(s)}
                    aria-label={s.isActive ? "Deactivate service" : "Activate service"}
                  />
                </TableCell>
                <TableCell className="text-right pr-4">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => onEditService(s)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                          disabled={deactivatingServiceId === s.id || togglingServiceId === s.id}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Service</AlertDialogTitle>
                          <AlertDialogDescription>
                            Permanently delete &ldquo;{s.nameEn}&rdquo;? This cannot be undone. If this service has existing tickets, use the toggle to deactivate it instead.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => onDeactivateService(s)}
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
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Departments & Services</h1>
            <p className="text-sm text-muted-foreground">
              Manage department structure and their queuing services
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void fetch()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => { setEditDept(null); setDeptFormOpen(true); }}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Department
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg border border-red-200 bg-red-50 text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="text-sm flex-1">{error}</span>
          <Button variant="outline" size="sm" onClick={() => void fetch()}>Retry</Button>
        </div>
      )}

      {/* Departments list */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-8"></TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Services</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right pr-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              : departments.length === 0 && !error
              ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      <Building2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      No departments yet
                    </TableCell>
                  </TableRow>
                )
              : departments.map((dept) => {
                  const expanded = expandedIds.has(dept.id);
                  return (
                    <>
                      <TableRow
                        key={dept.id}
                        className="cursor-pointer group"
                        onClick={() => toggleExpand(dept.id)}
                      >
                        <TableCell className="w-8">
                          {expanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-sm">{dept.nameEn}</div>
                          <div className="text-xs text-muted-foreground" dir="rtl">{dept.nameAr}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {dept.services.length} service{dept.services.length !== 1 ? "s" : ""}
                          </Badge>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Switch
                            checked={dept.isActive}
                            disabled={togglingDeptId === dept.id}
                            onCheckedChange={() => void handleToggleDept(dept)}
                            aria-label={dept.isActive ? "Deactivate department" : "Activate department"}
                          />
                        </TableCell>
                        <TableCell className="text-right pr-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => { setEditDept(dept); setDeptFormOpen(true); }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                                  disabled={deactivatingDeptId === dept.id || togglingDeptId === dept.id}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Department</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Permanently delete &ldquo;{dept.nameEn}&rdquo; and all its services? This cannot be undone. If this department has existing tickets, use the toggle to deactivate it instead.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() => void handleDeleteDept(dept.id)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expanded && (
                        <TableRow key={`${dept.id}-services`} className="hover:bg-transparent">
                          <TableCell colSpan={5} className="p-0 border-t-0">
                            <ServicesTable
                              department={dept}
                              onEditService={(s) => openEditService(dept.id, s)}
                              onToggleService={(s) => void handleToggleService(dept, s)}
                              togglingServiceId={togglingServiceId}
                              deactivatingServiceId={deactivatingServiceId}
                              onAddService={() => openAddService(dept.id)}
                              onDeactivateService={(s) => void handleDeleteService(dept.id, s.id)}
                            />
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
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

