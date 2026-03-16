import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Ticket,
  CheckCircle2,
  Clock,
  Users,
  Timer,
  Hourglass,
  UserX,
  TrendingUp,
} from "lucide-react";
import type { DashboardResponse } from "./types";

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function fmtDuration(sec: number): string {
  if (!sec || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function fmtPct(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

function delta(current: number, previous: number): { value: string; positive: boolean } | null {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) return { value: "+∞", positive: true };
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  const sign = pct >= 0 ? "+" : "";
  return { value: `${sign}${pct.toFixed(1)}%`, positive: pct >= 0 };
}

/* ── Card definitions ────────────────────────────────────────────────────── */

interface KPIDef {
  key: string;
  label: string;
  icon: React.ElementType;
  accent: string;
  bg: string;
  accentBar: string;
  getValue: (d: DashboardResponse["current"]) => string;
  getDelta: (c: DashboardResponse["current"], p: DashboardResponse["current"]) => ReturnType<typeof delta>;
  /** If true, a negative delta is actually a good thing (e.g. lower wait time). */
  invertDelta?: boolean;
}

const KPIS: KPIDef[] = [
  {
    key: "ticketsIssued",
    label: "Tickets Issued",
    icon: Ticket,
    accent: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    accentBar: "bg-gradient-to-r from-indigo-500 to-indigo-400",
    getValue: (d) => d.ticketsIssued.toLocaleString(),
    getDelta: (c, p) => delta(c.ticketsIssued, p.ticketsIssued),
  },
  {
    key: "ticketsServed",
    label: "Tickets Served",
    icon: CheckCircle2,
    accent: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    accentBar: "bg-gradient-to-r from-emerald-500 to-emerald-400",
    getValue: (d) => d.ticketsServed.toLocaleString(),
    getDelta: (c, p) => delta(c.ticketsServed, p.ticketsServed),
  },
  {
    key: "currentlyWaiting",
    label: "Currently Waiting",
    icon: Users,
    accent: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    accentBar: "bg-gradient-to-r from-amber-500 to-amber-400",
    getValue: (d) => d.currentlyWaiting.toLocaleString(),
    getDelta: () => null,
  },
  {
    key: "currentlyServing",
    label: "Currently Serving",
    icon: TrendingUp,
    accent: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    accentBar: "bg-gradient-to-r from-blue-500 to-blue-400",
    getValue: (d) => d.currentlyServing.toLocaleString(),
    getDelta: () => null,
  },
  {
    key: "avgWaitTime",
    label: "Avg Wait Time",
    icon: Clock,
    accent: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/40",
    accentBar: "bg-gradient-to-r from-orange-500 to-orange-400",
    getValue: (d) => fmtDuration(d.avgWaitTimeSec),
    getDelta: (c, p) => delta(c.avgWaitTimeSec, p.avgWaitTimeSec),
    invertDelta: true,
  },
  {
    key: "avgServiceTime",
    label: "Avg Service Time",
    icon: Hourglass,
    accent: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-50 dark:bg-teal-950/40",
    accentBar: "bg-gradient-to-r from-teal-500 to-teal-400",
    getValue: (d) => fmtDuration(d.avgServiceTimeSec),
    getDelta: (c, p) => delta(c.avgServiceTimeSec, p.avgServiceTimeSec),
    invertDelta: true,
  },
  {
    key: "noShowRate",
    label: "No-Show Rate",
    icon: UserX,
    accent: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    accentBar: "bg-gradient-to-r from-rose-500 to-rose-400",
    getValue: (d) => fmtPct(d.noShowRate),
    getDelta: (c, p) => delta(c.noShowRate, p.noShowRate),
    invertDelta: true,
  },
  {
    key: "completionRate",
    label: "Completion Rate",
    icon: Timer,
    accent: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/40",
    accentBar: "bg-gradient-to-r from-violet-500 to-violet-400",
    getValue: (d) => fmtPct(d.completionRate),
    getDelta: (c, p) => delta(c.completionRate, p.completionRate),
  },
];

/* ── Component ───────────────────────────────────────────────────────────── */

interface Props {
  data: DashboardResponse | null;
  loading: boolean;
}

export function KPICards({ data, loading }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {KPIS.map(({ key, label, icon: Icon, accent, bg, accentBar, getValue, getDelta, invertDelta }) => {
        const d = data ? getDelta(data.current, data.previous) : null;
        // For inverted metrics, flip the "positive" meaning for color
        const isGood = d ? (invertDelta ? !d.positive : d.positive) : null;

        return (
          <Card key={key} className="relative overflow-hidden p-4">
            {/* Subtle accent gradient stripe at top */}
            <div className={`absolute inset-x-0 top-0 h-0.5 ${accentBar}`} />
            <div className="flex items-center gap-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-md ${bg}`}>
                <Icon className={`h-3.5 w-3.5 ${accent}`} />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {label}
              </span>
            </div>

            {loading && !data ? (
              <Skeleton className="mt-3 h-8 w-20" />
            ) : (
              <div className="mt-3 flex items-end gap-2">
                <span className="text-2xl font-semibold tabular-nums tracking-tight">
                  {data ? getValue(data.current) : "—"}
                </span>
                {d && (
                  <span
                    className={`mb-0.5 text-xs font-medium ${
                      isGood
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {d.value}
                  </span>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
