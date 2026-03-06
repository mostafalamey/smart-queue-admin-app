import { useState, useEffect, useMemo } from "react";
import { useOrgMetadata, type UpdateOrgInput } from "./use-org-metadata";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Loader2,
  Save,
  X,
  AlertCircle,
  RefreshCw,
  Globe,
  Mail,
  MapPin,
  Clock,
  Building2,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ── Form state ─────────────────────────────────────────────────────────── */

interface FormState {
  nameEn: string;
  nameAr: string;
  address: string;
  email: string;
  website: string;
  timezone: string;
}

function validateForm(f: FormState): string | null {
  if (!f.nameEn.trim()) return "English name is required.";
  if (!f.nameAr.trim()) return "Arabic name is required.";
  if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim()))
    return "Enter a valid email address.";
  if (f.website && !/^https?:\/\/.+/.test(f.website.trim()))
    return "Website must start with http:// or https://";
  return null;
}

/* ── Timezone combobox ──────────────────────────────────────────────────── */

function TimezoneCombobox({
  value,
  onChange,
}: {
  value: string;
  onChange: (tz: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const allTimezones = useMemo(
    () => Intl.supportedValuesOf("timeZone"),
    []
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return allTimezones.slice(0, 80);
    return allTimezones.filter((tz) => tz.toLowerCase().includes(q)).slice(0, 80);
  }, [allTimezones, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className={cn(!value && "text-muted-foreground/40")}>
            {value || "Select timezone…"}
          </span>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search timezones…"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No timezone found.</CommandEmpty>
            <CommandGroup>
              {filtered.map((tz) => (
                <CommandItem
                  key={tz}
                  value={tz}
                  onSelect={(v) => {
                    onChange(v);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-3.5 w-3.5",
                      value === tz ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {tz}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/* ── Field row ──────────────────────────────────────────────────────────── */

function FieldRow({
  icon: Icon,
  label,
  hint,
  required,
  children,
  dirty,
}: {
  icon: React.ElementType;
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  dirty?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-5 rounded-xl border px-5 py-4 transition-colors",
        dirty
          ? "border-primary/30 bg-primary/[0.04]"
          : "border-white/[0.08] bg-card"
      )}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03]">
        <Icon className="h-3.5 w-3.5 text-muted-foreground/50" />
      </div>
      <div className="w-44 shrink-0">
        <p className="text-sm font-medium">
          {label}
          {required && <span className="ml-0.5 text-red-400">*</span>}
        </p>
        {hint && <p className="mt-0.5 text-[11px] text-muted-foreground/40">{hint}</p>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

/* ── Section label ──────────────────────────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/30">
      {children}
    </p>
  );
}

/* ── OrgMetadata page ───────────────────────────────────────────────────── */

export default function OrgMetadata() {
  const { org, loading, error, fetch, update } = useOrgMetadata();
  const [form, setForm] = useState<FormState>({
    nameEn: "",
    nameAr: "",
    address: "",
    email: "",
    website: "",
    timezone: "",
  });
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  useEffect(() => {
    if (org) {
      setForm({
        nameEn: org.nameEn,
        nameAr: org.nameAr,
        address: org.address ?? "",
        email: org.email ?? "",
        website: org.website ?? "",
        timezone: org.timezone,
      });
      setDirty(false);
    }
  }, [org]);

  const set = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
    setFormError(null);
  };

  const handleReset = () => {
    if (!org) return;
    setForm({
      nameEn: org.nameEn,
      nameAr: org.nameAr,
      address: org.address ?? "",
      email: org.email ?? "",
      website: org.website ?? "",
      timezone: org.timezone,
    });
    setDirty(false);
    setFormError(null);
  };

  const handleSave = async () => {
    const err = validateForm(form);
    if (err) { setFormError(err); return; }

    const input: UpdateOrgInput = {};
    if (org) {
      if (form.nameEn !== org.nameEn) input.nameEn = form.nameEn.trim();
      if (form.nameAr !== org.nameAr) input.nameAr = form.nameAr.trim();
      if (form.address !== (org.address ?? "")) input.address = form.address.trim();
      if (form.email !== (org.email ?? "")) input.email = form.email.trim();
      if (form.website !== (org.website ?? "")) input.website = form.website.trim();
      if (form.timezone !== org.timezone) input.timezone = form.timezone.trim();
    }

    if (Object.keys(input).length === 0) { setDirty(false); return; }

    setSaving(true);
    try {
      await update(input);
      toast.success("Organization details saved.");
      setDirty(false);
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

  /* Field-level dirty check */
  const isDirty = (key: keyof FormState) => {
    if (!org) return false;
    const original = key === "address" || key === "email" || key === "website"
      ? (org[key] ?? "")
      : org[key as "nameEn" | "nameAr" | "timezone"];
    return form[key] !== original;
  };

  /* ── Loading ──────────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-52" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[68px] w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  /* ── Error ────────────────────────────────────────────────────────────── */
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Organization Metadata</h1>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-sm">{error}</span>
          <Button variant="outline" size="sm" onClick={() => void fetch()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  /* ── Main ─────────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Organization Metadata</h1>
          <p className="mt-0.5 text-sm text-muted-foreground/60">
            Hospital identity and contact details
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dirty && (
            <Button variant="outline" size="sm" onClick={handleReset} disabled={saving}>
              <X className="h-3.5 w-3.5 mr-1.5" />
              Discard
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => void handleSave()}
            disabled={saving || !dirty}
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5 mr-1.5" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Validation error */}
      {formError && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="text-sm">{formError}</span>
        </div>
      )}

      {/* Identity section */}
      <div className="space-y-3">
        <SectionLabel>Identity</SectionLabel>
        <FieldRow
          icon={Building2}
          label="English Name"
          required
          dirty={isDirty("nameEn")}
        >
          <Input
            value={form.nameEn}
            onChange={(e) => set("nameEn", e.target.value)}
            placeholder="e.g. City General Hospital"
          />
        </FieldRow>
        <FieldRow
          icon={Building2}
          label="Arabic Name"
          hint="Displayed right-to-left"
          required
          dirty={isDirty("nameAr")}
        >
          <Input
            dir="rtl"
            value={form.nameAr}
            onChange={(e) => set("nameAr", e.target.value)}
            placeholder="مستشفى المدينة العام"
            className="text-right"
          />
        </FieldRow>
      </div>

      {/* Contact section */}
      <div className="space-y-3">
        <SectionLabel>Contact</SectionLabel>
        <FieldRow
          icon={MapPin}
          label="Address"
          dirty={isDirty("address")}
        >
          <Input
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
            placeholder="King Fahd Road, Riyadh"
          />
        </FieldRow>
        <FieldRow
          icon={Mail}
          label="Contact Email"
          dirty={isDirty("email")}
        >
          <Input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="info@hospital.com"
          />
        </FieldRow>
        <FieldRow
          icon={Globe}
          label="Website"
          dirty={isDirty("website")}
        >
          <Input
            type="url"
            value={form.website}
            onChange={(e) => set("website", e.target.value)}
            placeholder="https://hospital.com"
          />
        </FieldRow>
      </div>

      {/* System section */}
      <div className="space-y-3">
        <SectionLabel>System</SectionLabel>
        <FieldRow
          icon={Clock}
          label="Timezone"
          hint="Affects ticket date bucketing & daily resets"
          dirty={isDirty("timezone")}
        >
          <TimezoneCombobox
            value={form.timezone}
            onChange={(tz) => set("timezone", tz)}
          />
        </FieldRow>
      </div>
    </div>
  );
}

