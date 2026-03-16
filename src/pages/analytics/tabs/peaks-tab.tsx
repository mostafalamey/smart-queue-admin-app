import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Flame } from "lucide-react";
import type { AnalyticsFilters, PeakPatternCell, PriorityBreakdown } from "../types";
import { usePeakPatterns, usePriorityBreakdown } from "../use-analytics-data";

/* ── Constants ───────────────────────────────────────────────────────────── */

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const priorityConfig: ChartConfig = {
  count: { label: "Tickets", color: "var(--chart-1)" },
};

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function heatColor(value: number, max: number): string {
  if (max === 0 || value === 0) return "var(--muted)";
  const ratio = value / max;
  // Low → teal-cool · Medium → warm amber · High → hot coral-red
  if (ratio < 0.2) return `oklch(0.72 0.14 178 / ${0.2 + ratio * 2})`;
  if (ratio < 0.4) return `oklch(0.65 0.15 155 / ${0.4 + ratio})`;
  if (ratio < 0.6) return `oklch(0.72 0.155 72 / ${0.5 + ratio * 0.5})`;
  if (ratio < 0.8) return `oklch(0.62 0.18 40 / ${0.6 + ratio * 0.3})`;
  return `oklch(0.58 0.22 25 / ${0.75 + ratio * 0.25})`;
}

/* ── Props ───────────────────────────────────────────────────────────────── */

interface Props {
  filters: AnalyticsFilters;
}

/* ── Component ───────────────────────────────────────────────────────────── */

export function PeaksTab({ filters }: Props) {
  const { data: peakData, loading: peakLoading } = usePeakPatterns(filters);
  const { data: priorityData, loading: priorityLoading } = usePriorityBreakdown(filters);

  // Build a 7×24 lookup and find max value
  const { grid, max, top5 } = useMemo(() => {
    if (!peakData) return { grid: new Map<string, number>(), max: 0, top5: [] as PeakPatternCell[] };
    const g = new Map<string, number>();
    let mx = 0;
    for (const c of peakData) {
      g.set(`${c.dayOfWeek}-${c.hour}`, c.ticketCount);
      if (c.ticketCount > mx) mx = c.ticketCount;
    }
    // Top 5 busiest slots
    const sorted = [...peakData].sort((a, b) => b.ticketCount - a.ticketCount);
    return { grid: g, max: mx, top5: sorted.slice(0, 5) };
  }, [peakData]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Heatmap — takes 2 cols */}
        <Card className="p-4 lg:col-span-2">
          <h3 className="mb-3 text-sm font-medium">Peak Hours Heatmap</h3>
          {peakLoading && !peakData ? (
            <Skeleton className="h-[240px] w-full" />
          ) : peakData?.length ? (
            <HeatmapGrid grid={grid} max={max} />
          ) : (
            <EmptyState label="No peak data available" />
          )}
        </Card>

        {/* Busiest Periods */}
        <Card className="p-4">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-medium">
            <Flame className="h-4 w-4 text-orange-500" />
            Busiest Periods
          </h3>
          {peakLoading && !peakData ? (
            <Skeleton className="h-[200px] w-full" />
          ) : top5.length ? (
            <ol className="space-y-2">
              {top5.map((c, i) => (
                <li key={i} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span className="font-medium">
                    {DAYS[c.dayOfWeek]} {c.hour.toString().padStart(2, "0")}:00
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {c.ticketCount} tickets
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState label="No data" />
          )}
        </Card>
      </div>

      {/* Priority Breakdown */}
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-medium">Priority Breakdown</h3>
        {priorityLoading && !priorityData ? (
          <Skeleton className="h-[200px] w-full" />
        ) : priorityData?.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartContainer config={priorityConfig} className="h-[200px] w-full">
              <BarChart data={priorityData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="priorityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-count)" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="var(--color-count)" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="opacity-40" />
                <XAxis dataKey="priorityName" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={36} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="url(#priorityGrad)" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ChartContainer>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Priority</TableHead>
                  <TableHead>Tickets</TableHead>
                  <TableHead>Avg Wait</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {priorityData.map((p) => (
                  <TableRow key={p.priorityName}>
                    <TableCell className="font-medium">{p.priorityName}</TableCell>
                    <TableCell className="tabular-nums">{p.count}</TableCell>
                    <TableCell className="tabular-nums">{fmtDuration(p.avgWaitTimeSec)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState label="No priority data for selected period" />
        )}
      </Card>
    </div>
  );
}

/* ── Heatmap Grid (custom CSS grid) ──────────────────────────────────────── */

function HeatmapGrid({ grid, max }: { grid: Map<string, number>; max: number }) {
  return (
    <TooltipProvider delayDuration={100}>
      <div className="overflow-x-auto">
        {/* Hour labels */}
        <div className="ml-10 grid grid-cols-24 gap-px text-center">
          {HOURS.map((h) => (
            <span key={h} className="text-[10px] tabular-nums text-muted-foreground">
              {h.toString().padStart(2, "0")}
            </span>
          ))}
        </div>

        {/* Day rows */}
        {DAYS.map((day, di) => (
          <div key={day} className="flex items-center gap-px">
            <span className="w-10 shrink-0 text-right text-[11px] font-medium text-muted-foreground pr-1.5">
              {day}
            </span>
            <div className="grid flex-1 grid-cols-24 gap-px">
              {HOURS.map((h) => {
                const count = grid.get(`${di}-${h}`) ?? 0;
                return (
                  <Tooltip key={h}>
                    <TooltipTrigger asChild>
                      <div
                        className="aspect-square rounded-[3px] transition-colors"
                        style={{ backgroundColor: heatColor(count, max) }}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      {day} {h.toString().padStart(2, "0")}:00 — {count} tickets
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        ))}

        {/* Color scale legend */}
        <div className="mt-2 ml-10 flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span>Less</span>
          {[0, 0.25, 0.5, 0.75, 1].map((r) => (
            <div
              key={r}
              className="h-3 w-3 rounded-[2px]"
              style={{ backgroundColor: heatColor(r * max, max) }}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </TooltipProvider>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}
