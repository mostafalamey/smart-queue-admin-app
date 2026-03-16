import { useEffect, useState } from "react";
import { getStoredUser } from "@/lib/stored-user";
import { apiJson } from "@/lib/api-client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CalendarDays, RefreshCw } from "lucide-react";
import type { AnalyticsFilters, Department, TimePreset } from "./types";

/* ── Date helpers ────────────────────────────────────────────────────────── */

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfDay(d: Date): Date {
  const n = new Date(d);
  n.setHours(0, 0, 0, 0);
  return n;
}

function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

function startOfWeek(d: Date): Date {
  const c = new Date(d);
  c.setDate(c.getDate() - c.getDay());
  c.setHours(0, 0, 0, 0);
  return c;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function getPresetRange(preset: TimePreset): { from: string; to: string } {
  const today = startOfDay(new Date());
  switch (preset) {
    case "today":
      return { from: isoDate(today), to: isoDate(today) };
    case "yesterday": {
      const y = addDays(today, -1);
      return { from: isoDate(y), to: isoDate(y) };
    }
    case "thisWeek":
      return { from: isoDate(startOfWeek(today)), to: isoDate(today) };
    case "thisMonth":
      return { from: isoDate(startOfMonth(today)), to: isoDate(today) };
    case "last30":
      return { from: isoDate(addDays(today, -29)), to: isoDate(today) };
    default:
      return { from: isoDate(today), to: isoDate(today) };
  }
}

const PRESETS: { value: TimePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "thisWeek", label: "This Week" },
  { value: "thisMonth", label: "This Month" },
  { value: "last30", label: "Last 30 Days" },
  { value: "custom", label: "Custom Range" },
];

/* ── Props ───────────────────────────────────────────────────────────────── */

interface Props {
  filters: AnalyticsFilters;
  onFiltersChange: (f: AnalyticsFilters) => void;
  onRefresh?: () => void;
}

/* ── Component ───────────────────────────────────────────────────────────── */

export function AnalyticsFiltersBar({ filters, onFiltersChange, onRefresh }: Props) {
  const user = getStoredUser();
  const isManager = user?.role === "MANAGER";

  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptsLoading, setDeptsLoading] = useState(true);
  const [preset, setPreset] = useState<TimePreset>("today");
  const [customFrom, setCustomFrom] = useState<Date | undefined>(undefined);
  const [customTo, setCustomTo] = useState<Date | undefined>(undefined);

  // Fetch departments once
  useEffect(() => {
    let cancelled = false;
    apiJson<Department[]>("/departments")
      .then((d) => { if (!cancelled) setDepartments(d); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setDeptsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Auto-lock Manager to their department
  useEffect(() => {
    if (isManager && user?.departmentId && filters.departmentId !== user.departmentId) {
      onFiltersChange({ ...filters, departmentId: user.departmentId });
    }
  }, [isManager, user?.departmentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePreset = (p: TimePreset) => {
    setPreset(p);
    if (p !== "custom") {
      const range = getPresetRange(p);
      onFiltersChange({ ...filters, ...range });
    }
  };

  const applyCustomRange = () => {
    if (customFrom && customTo) {
      onFiltersChange({ ...filters, from: isoDate(customFrom), to: isoDate(customTo) });
    }
  };

  const handleDepartment = (id: string) => {
    onFiltersChange({
      ...filters,
      departmentId: id === "__all__" ? undefined : id,
      serviceId: undefined,
    });
  };

  const handleGranularity = (g: string) => {
    if (g) onFiltersChange({ ...filters, granularity: g as AnalyticsFilters["granularity"] });
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      {/* Time Range Preset */}
      <div className="w-44">
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Time Range
        </label>
        <Select value={preset} onValueChange={(v) => handlePreset(v as TimePreset)}>
          <SelectTrigger>
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            {PRESETS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Custom date range picker */}
      {preset === "custom" && (
        <div className="flex items-end gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <CalendarDays className="h-3.5 w-3.5" />
                {customFrom ? isoDate(customFrom) : "From"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={customFrom} onSelect={setCustomFrom} />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <CalendarDays className="h-3.5 w-3.5" />
                {customTo ? isoDate(customTo) : "To"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={customTo} onSelect={setCustomTo} />
            </PopoverContent>
          </Popover>
          <Button size="sm" onClick={applyCustomRange} disabled={!customFrom || !customTo}>
            Apply
          </Button>
        </div>
      )}

      {/* Department */}
      <div className="w-52">
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Department
        </label>
        {deptsLoading ? (
          <Skeleton className="h-9 w-full rounded-md" />
        ) : (
          <Select
            value={filters.departmentId ?? "__all__"}
            onValueChange={handleDepartment}
            disabled={isManager}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              {!isManager && (
                <SelectItem value="__all__">All Departments</SelectItem>
              )}
              {(isManager
                ? departments.filter((d) => d.id === user?.departmentId)
                : departments
              ).map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.nameEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Granularity */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Granularity
        </label>
        <ToggleGroup
          type="single"
          value={filters.granularity ?? "daily"}
          onValueChange={handleGranularity}
          className="h-9"
        >
          <ToggleGroupItem value="hourly" className="text-xs px-3">
            Hourly
          </ToggleGroupItem>
          <ToggleGroupItem value="daily" className="text-xs px-3">
            Daily
          </ToggleGroupItem>
          <ToggleGroupItem value="weekly" className="text-xs px-3">
            Weekly
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Refresh */}
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0"
        onClick={onRefresh}
        title="Refresh analytics"
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
    </div>
  );
}
