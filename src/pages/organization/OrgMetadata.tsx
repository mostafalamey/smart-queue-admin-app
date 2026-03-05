import { useState, useEffect } from "react";
import { useOrgMetadata, type UpdateOrgInput } from "./use-org-metadata";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Save, X, Building2 } from "lucide-react";
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
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

    if (Object.keys(input).length === 0) {
      setDirty(false);
      return;
    }

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

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="space-y-4 max-w-xl">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive max-w-xl">
          {error}
          <Button variant="link" className="ml-2 h-auto p-0 text-destructive" onClick={() => void fetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Organization Details</h2>
          <p className="text-sm text-muted-foreground">
            Manage your hospital's public identity and contact information.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basic Information</CardTitle>
          <CardDescription>Hospital name and contact details visible to patients and staff.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-5">
            {formError && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {formError}
              </div>
            )}

            <div className="grid gap-1.5">
              <Label htmlFor="nameEn">English Name <span className="text-destructive">*</span></Label>
              <Input
                id="nameEn"
                value={form.nameEn}
                onChange={(e) => set("nameEn", e.target.value)}
                placeholder="e.g. City General Hospital"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="nameAr">Arabic Name <span className="text-destructive">*</span></Label>
              <Input
                id="nameAr"
                dir="rtl"
                value={form.nameAr}
                onChange={(e) => set("nameAr", e.target.value)}
                placeholder="e.g. مستشفى المدينة العام"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                placeholder="e.g. King Fahd Road, Riyadh"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="email">Contact Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="info@hospital.com"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={form.website}
                  onChange={(e) => set("website", e.target.value)}
                  placeholder="https://hospital.com"
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={form.timezone}
                onChange={(e) => set("timezone", e.target.value)}
                placeholder="e.g. Asia/Riyadh"
              />
              <p className="text-xs text-muted-foreground">
                IANA timezone identifier — affects ticket date bucketing and daily queue resets.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button type="submit" disabled={saving || !dirty}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </Button>
              {dirty && (
                <Button type="button" variant="outline" onClick={handleReset} disabled={saving}>
                  <X className="mr-2 h-4 w-4" />
                  Discard
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

