import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  KeyRound,
  Users,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useUserManagement,
  type ManagedUser,
  type CreateUserInput,
  type UpdateUserInput,
  type UserRole,
  extractErrorMessage,
} from "./use-user-management";
import { apiJson } from "@/lib/api-client";

/* ── Types ──────────────────────────────────────────────────────────────── */

interface DeptOption {
  id: string;
  nameEn: string;
}

interface UserFormState {
  email: string;
  name: string;
  password: string;
  role: UserRole;
  departmentId: string;
}

const emptyForm = (): UserFormState => ({
  email: "",
  name: "",
  password: "",
  role: "STAFF",
  departmentId: "",
});

const toFormState = (u: ManagedUser): UserFormState => ({
  email: u.email,
  name: u.name ?? "",
  password: "",
  role: u.roleAssignments[0]?.role ?? "STAFF",
  departmentId: u.roleAssignments[0]?.departmentId ?? "",
});

function validateUserForm(f: UserFormState, isCreate: boolean): string | null {
  if (!f.email.trim()) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim()))
    return "Enter a valid email address";
  if (isCreate && !f.password) return "Password is required";
  if (isCreate && f.password.length < 12)
    return "Password must be at least 12 characters";
  if ((f.role === "MANAGER" || f.role === "STAFF") && !f.departmentId)
    return `Department is required for ${f.role} role`;
  return null;
}

/* ── Role badge ─────────────────────────────────────────────────────────── */

const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: "border-red-400/20 bg-red-400/10 text-red-400",
  IT: "border-purple-400/20 bg-purple-400/10 text-purple-400",
  MANAGER: "border-blue-400/20 bg-blue-400/10 text-blue-400",
  STAFF: "border-slate-400/20 bg-slate-400/10 text-slate-400",
};

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
        ROLE_COLORS[role]
      )}
    >
      {role}
    </span>
  );
}

/* ── User Form Dialog ───────────────────────────────────────────────────── */

interface UserFormDialogProps {
  open: boolean;
  editTarget: ManagedUser | null;
  departments: DeptOption[];
  onClose: () => void;
  onCreate: (input: CreateUserInput) => Promise<void>;
  onUpdate: (id: string, input: UpdateUserInput) => Promise<void>;
}

function UserFormDialog({
  open,
  editTarget,
  departments,
  onClose,
  onCreate,
  onUpdate,
}: UserFormDialogProps) {
  const isCreate = editTarget === null;
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(editTarget ? toFormState(editTarget) : emptyForm());
      setFieldError(null);
    }
  }, [open, editTarget]);

  const set = (key: keyof UserFormState, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  const needsDept = form.role === "MANAGER" || form.role === "STAFF";

  async function handleSubmit() {
    const err = validateUserForm(form, isCreate);
    if (err) { setFieldError(err); return; }
    setSaving(true);
    try {
      if (isCreate) {
        const input: CreateUserInput = {
          email: form.email.trim(),
          password: form.password,
          role: form.role,
          ...(form.name.trim() && { name: form.name.trim() }),
          ...(needsDept && form.departmentId && { departmentId: form.departmentId }),
        };
        await onCreate(input);
      } else {
        const input: UpdateUserInput = {
          email: form.email.trim(),
          role: form.role,
          ...(form.name.trim() && { name: form.name.trim() }),
          departmentId: needsDept && form.departmentId ? form.departmentId : null,
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
            <Users className="h-4 w-4" />
            {isCreate ? "Create User" : "Edit User"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isCreate ? "Create a new system user and assign a role." : "Edit user details and role assignment."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="u-email">Email *</Label>
              <Input
                id="u-email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="user@hospital.com"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="u-name">Display Name</Label>
              <Input
                id="u-name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Full name"
              />
            </div>
            {isCreate && (
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="u-password">Password *</Label>
                <Input
                  id="u-password"
                  type="password"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="Min 8 characters"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Role *</Label>
              <Select
                value={form.role}
                onValueChange={(v) => {
                  const newRole = v as UserRole;
                  const newNeedsDept = newRole === "MANAGER" || newRole === "STAFF";
                  setForm((p) => ({
                    ...p,
                    role: newRole,
                    departmentId: newNeedsDept ? p.departmentId : "",
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="IT">IT</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="STAFF">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Department {needsDept && "*"}</Label>
              <Select
                value={form.departmentId}
                onValueChange={(v) => set("departmentId", v)}
                disabled={!needsDept}
              >
                <SelectTrigger>
                  <SelectValue placeholder={needsDept ? "Select dept." : "—"} />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.nameEn}
                    </SelectItem>
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
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving…" : isCreate ? "Create" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Reset Password Dialog ──────────────────────────────────────────────── */

interface ResetPasswordDialogProps {
  open: boolean;
  user: ManagedUser | null;
  onClose: () => void;
  onReset: (id: string, password: string) => Promise<void>;
}

function ResetPasswordDialog({ open, user, onClose, onReset }: ResetPasswordDialogProps) {
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  useEffect(() => {
    if (open) { setPassword(""); setFieldError(null); }
  }, [open]);

  async function handleSubmit() {
    if (!password) { setFieldError("Password is required"); return; }
    if (password.length < 8) { setFieldError("Min 8 characters"); return; }
    if (!user) return;
    setSaving(true);
    try {
      await onReset(user.id, password);
      toast.success("Password reset successfully");
      onClose();
    } catch (err) {
      setFieldError(extractErrorMessage(err, "Reset failed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            Reset Password
          </DialogTitle>
          <DialogDescription className="sr-only">
            Set a new password for this user.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {user && (
            <p className="text-sm text-muted-foreground">
              Setting new password for <span className="font-medium text-foreground">{user.email}</span>.
            </p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="rp-password">New Password</Label>
            <Input
              id="rp-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters"
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
            {saving ? "Resetting…" : "Reset Password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Main Page ──────────────────────────────────────────────────────────── */

export default function UserManagement() {
  const { users, loading, error, fetch, create, update, resetPassword } =
    useUserManagement();
  const [departments, setDepartments] = useState<DeptOption[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ManagedUser | null>(null);
  const [resetTarget, setResetTarget] = useState<ManagedUser | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadDepartments = useCallback(async () => {
    try {
      const data = await apiJson<{ departments: DeptOption[] }>("/admin/departments");
      setDepartments(data.departments);
    } catch {
      /* non-critical */
    }
  }, []);

  useEffect(() => {
    void fetch();
    void loadDepartments();
  }, [fetch, loadDepartments]);

  async function handleCreate(input: CreateUserInput) {
    await create(input);
    toast.success("User created");
  }

  async function handleUpdate(id: string, input: UpdateUserInput) {
    await update(id, input);
    toast.success("User updated");
  }

  async function handleToggleActive(user: ManagedUser) {
    setTogglingId(user.id);
    try {
      await update(user.id, { isActive: !user.isActive });
      toast.success(`User ${user.isActive ? "deactivated" : "activated"}`);
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to update status"));
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDeactivateUser(u: ManagedUser) {
    setTogglingId(u.id);
    try {
      await update(u.id, { isActive: false });
      toast.success("User deactivated");
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to deactivate user"));
    } finally {
      setTogglingId(null);
    }
  }

  function openCreate() {
    setEditTarget(null);
    setFormOpen(true);
  }

  function openEdit(u: ManagedUser) {
    setEditTarget(u);
    setFormOpen(true);
  }

  /* ── Render ─────────────────────────────────────────────────────────── */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">User Management</h1>
          <p className="mt-0.5 text-sm text-muted-foreground/60">
            Manage system users and role assignments
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void fetch()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Refresh
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add User
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-sm">{error}</span>
          <Button variant="outline" size="sm" onClick={() => void fetch()}>Retry</Button>
        </div>
      )}

      {/* User cards */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-card px-5 py-4">
              <Skeleton className="h-9 w-16 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-5 w-10 rounded-full" />
            </div>
          ))
        ) : users.length === 0 && !error ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/[0.06] py-16 text-muted-foreground/30">
            <Users className="h-10 w-10" />
            <p className="text-sm">No users found</p>
            <Button variant="outline" size="sm" className="mt-1" onClick={openCreate}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add the first user
            </Button>
          </div>
        ) : (
          users.map((u) => {
            const assignment = u.roleAssignments[0];
            const deptName = assignment?.departmentId
              ? departments.find((d) => d.id === assignment.departmentId)?.nameEn
              : null;
            return (
              <div
                key={u.id}
                className={cn(
                  "flex items-center gap-4 rounded-xl border border-white/[0.08] bg-card px-5 py-4 transition-opacity",
                  !u.isActive && "opacity-50"
                )}
              >
                {/* Role badge */}
                {assignment ? (
                  <RoleBadge role={assignment.role} />
                ) : (
                  <span className="inline-flex items-center rounded-full border border-white/[0.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground/30">
                    No role
                  </span>
                )}

                {/* Identity */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <p className="text-sm font-semibold shrink-0">
                      {u.name ?? <span className="italic text-muted-foreground/40">No name</span>}
                    </p>
                    <span className="text-muted-foreground/20 text-xs shrink-0">/</span>
                    <p className="text-sm text-muted-foreground/60 truncate">{u.email}</p>
                  </div>
                  {deptName && (
                    <p className="mt-0.5 text-xs text-muted-foreground/40">{deptName}</p>
                  )}
                  {u.mustChangePassword && (
                    <span className="mt-1 inline-flex items-center rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                      Must change password
                    </span>
                  )}
                </div>

                {/* Active toggle */}
                <Switch
                  checked={u.isActive}
                  disabled={togglingId === u.id}
                  onCheckedChange={() => void handleToggleActive(u)}
                  aria-label={u.isActive ? "Deactivate user" : "Activate user"}
                  className="shrink-0"
                />

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-0.5">
                  <Button
                    variant="ghost" size="icon"
                    className="h-8 w-8 text-muted-foreground/40 hover:text-foreground"
                    onClick={() => openEdit(u)}
                    title="Edit user"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    className="h-8 w-8 text-muted-foreground/40 hover:text-foreground"
                    onClick={() => setResetTarget(u)}
                    title="Reset password"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-red-400/40 hover:text-red-400"
                        disabled={togglingId === u.id}
                        title="Deactivate user"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Deactivate User</AlertDialogTitle>
                        <AlertDialogDescription>
                          Deactivate {u.name ? `"${u.name}"` : u.email}? They will immediately lose access to the system.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => void handleDeactivateUser(u)}
                        >
                          Deactivate
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Dialogs */}
      <UserFormDialog
        open={formOpen}
        editTarget={editTarget}
        departments={departments}
        onClose={() => setFormOpen(false)}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />
      <ResetPasswordDialog
        open={resetTarget !== null}
        user={resetTarget}
        onClose={() => setResetTarget(null)}
        onReset={resetPassword}
      />
    </div>
  );
}

