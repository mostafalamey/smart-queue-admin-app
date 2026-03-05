import { useState, useEffect } from "react";
import {
  useTransferReasons,
  type TransferReason,
  type CreateTransferReasonInput,
  type UpdateTransferReasonInput,
} from "./use-transfer-reasons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, PowerOff, Power, Loader2, Trash2 } from "lucide-react";
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
import { toast } from "sonner";

/* ── Form state ─────────────────────────────────────────────────────────── */

interface FormState {
  nameEn: string;
  nameAr: string;
  sortOrder: string;
  isActive: boolean;
}

const emptyForm = (nextOrder: number): FormState => ({
  nameEn: "",
  nameAr: "",
  sortOrder: String(nextOrder),
  isActive: true,
});

const toFormState = (r: TransferReason): FormState => ({
  nameEn: r.nameEn,
  nameAr: r.nameAr,
  sortOrder: String(r.sortOrder),
  isActive: r.isActive,
});

function validateForm(f: FormState): string | null {
  if (!f.nameEn.trim()) return "English name is required.";
  if (!f.nameAr.trim()) return "Arabic name is required.";
  const order = Number(f.sortOrder);
  if (!Number.isInteger(order) || order < 0)
    return "Display order must be a non-negative integer.";
  return null;
}

/* ── ReasonFormDialog ───────────────────────────────────────────────────── */

interface ReasonFormDialogProps {
  open: boolean;
  editing: TransferReason | null;
  nextOrder: number;
  onClose: () => void;
  onSave: (input: CreateTransferReasonInput | UpdateTransferReasonInput) => Promise<void>;
}

function ReasonFormDialog({ open, editing, nextOrder, onClose, onSave }: ReasonFormDialogProps) {
  const [form, setForm] = useState<FormState>(emptyForm(nextOrder));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(editing ? toFormState(editing) : emptyForm(nextOrder));
      setFormError(null);
    }
  }, [open, editing, nextOrder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateForm(form);
    if (err) { setFormError(err); return; }

    setSaving(true);
    try {
      await onSave({
        nameEn: form.nameEn.trim(),
        nameAr: form.nameAr.trim(),
        sortOrder: Number(form.sortOrder),
        isActive: form.isActive,
      });
      onClose();
    } catch (err: unknown) {
      const e = err as Record<string, unknown>;
      setFormError(
        (typeof e?.message === "string" && e.message) ||
        (err instanceof Error ? err.message : "Save failed")
      );
    } finally {
      setSaving(false);
    }
  };

  const set = (key: keyof FormState, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Transfer Reason" : "Add Transfer Reason"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the details for this transfer reason."
              : "Create a new reason that tellers can select when transferring a patient."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {formError}
            </div>
          )}

          <div className="grid gap-1.5">
            <Label htmlFor="nameEn">English Name</Label>
            <Input
              id="nameEn"
              value={form.nameEn}
              onChange={(e) => set("nameEn", e.target.value)}
              placeholder="e.g. Wrong Department"
              autoFocus
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="nameAr">Arabic Name</Label>
            <Input
              id="nameAr"
              value={form.nameAr}
              dir="rtl"
              onChange={(e) => set("nameAr", e.target.value)}
              placeholder="e.g. قسم خاطئ"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="sortOrder">Display Order</Label>
            <Input
              id="sortOrder"
              type="number"
              min={0}
              step={1}
              value={form.sortOrder}
              onChange={(e) => set("sortOrder", e.target.value)}
              className="w-28"
            />
          </div>

          {editing && (
            <div className="flex items-center gap-3">
              <Switch
                id="isActive"
                checked={form.isActive}
                onCheckedChange={(v) => set("isActive", v)}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ── TransferReasons page ───────────────────────────────────────────────── */

export default function TransferReasons() {
  const { reasons, loading, error, fetch, create, update, deactivate, deleteReason } =
    useTransferReasons();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TransferReason | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const nextOrder = reasons.length > 0
    ? Math.max(...reasons.map((r) => r.sortOrder)) + 10
    : 10;

  const openCreate = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (r: TransferReason) => { setEditing(r); setDialogOpen(true); };
  const closeDialog = () => setDialogOpen(false);

  const handleSave = async (input: CreateTransferReasonInput | UpdateTransferReasonInput) => {
    if (editing) {
      await update(editing.id, input as UpdateTransferReasonInput);
      toast.success("Transfer reason updated.");
    } else {
      await create(input as CreateTransferReasonInput);
      toast.success("Transfer reason created.");
    }
  };

  const handleToggleActive = async (r: TransferReason) => {
    setTogglingId(r.id);
    try {
      if (r.isActive) {
        await deactivate(r.id);
        toast.success(`"${r.nameEn}" deactivated.`);
      } else {
        await update(r.id, { isActive: true });
        toast.success(`"${r.nameEn}" reactivated.`);
      }
    } catch (err: unknown) {
      const e = err as Record<string, unknown>;
      toast.error(
        (typeof e?.message === "string" && e.message) ||
        (err instanceof Error ? err.message : "Action failed")
      );
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (r: TransferReason) => {
    setDeletingId(r.id);
    try {
      await deleteReason(r.id);
      toast.success(`"${r.nameEn}" deleted.`);
    } catch (err: unknown) {
      const e = err as Record<string, unknown>;
      toast.error(
        (typeof e?.message === "string" && e.message) ||
        (err instanceof Error ? err.message : "Delete failed")
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Transfer Reasons</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the reasons tellers can select when transferring a patient to another service.
          </p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Reason
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Table */}
      <Card>
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : reasons.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-muted-foreground">
            No transfer reasons yet. Click "Add Reason" to create the first one.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-right">#</TableHead>
                <TableHead>English Name</TableHead>
                <TableHead>Arabic Name</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="w-28 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reasons.map((reason) => (
                <TableRow key={reason.id} className={!reason.isActive ? "opacity-50" : ""}>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {reason.sortOrder}
                  </TableCell>
                  <TableCell className="font-medium">{reason.nameEn}</TableCell>
                  <TableCell dir="rtl" className="text-right font-medium">
                    {reason.nameAr}
                  </TableCell>
                  <TableCell>
                    <Badge variant={reason.isActive ? "default" : "secondary"}>
                      {reason.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(reason)}
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={togglingId === reason.id}
                        onClick={() => handleToggleActive(reason)}
                        title={reason.isActive ? "Deactivate" : "Reactivate"}
                      >
                        {togglingId === reason.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : reason.isActive ? (
                          <PowerOff className="h-3.5 w-3.5" />
                        ) : (
                          <Power className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                            disabled={deletingId === reason.id}
                            title="Delete"
                          >
                            {deletingId === reason.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Transfer Reason</AlertDialogTitle>
                            <AlertDialogDescription>
                              Permanently delete &ldquo;{reason.nameEn}&rdquo;? This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => void handleDelete(reason)}
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
      </Card>

      <ReasonFormDialog
        open={dialogOpen}
        editing={editing}
        nextOrder={nextOrder}
        onClose={closeDialog}
        onSave={handleSave}
      />
    </div>
  );
}

