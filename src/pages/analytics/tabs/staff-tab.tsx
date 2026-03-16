import { useMemo, useState } from "react";
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
import { ArrowUpDown } from "lucide-react";
import type { AnalyticsFilters, StaffPerformance } from "../types";
import { useStaffPerformance } from "../use-analytics-data";

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function fmtPct(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

type SortKey = "userName" | "ticketsServed" | "avgServiceTimeSec" | "noShowCount" | "noShowRate";
type SortDir = "asc" | "desc";

const chartConfig: ChartConfig = {
  avgServiceTimeSec: { label: "Avg Service Time (sec)", color: "var(--chart-2)" },
};

/* ── Props ───────────────────────────────────────────────────────────────── */

interface Props {
  filters: AnalyticsFilters;
}

/* ── Component ───────────────────────────────────────────────────────────── */

export function StaffTab({ filters }: Props) {
  const { data, loading } = useStaffPerformance(filters);
  const [sortKey, setSortKey] = useState<SortKey>("ticketsServed");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = useMemo(() => {
    if (!data) return [];
    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  }, [data, sortKey, sortDir]);

  const toggle = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const top10 = useMemo(
    () => (sorted.slice(0, 10).map((s) => ({ name: s.userName.split(" ")[0], avgServiceTimeSec: s.avgServiceTimeSec }))),
    [sorted],
  );

  const SortableHead = ({ label, col }: { label: string; col: SortKey }) => (
    <TableHead
      className="cursor-pointer select-none whitespace-nowrap"
      onClick={() => toggle(col)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown className={`h-3 w-3 ${sortKey === col ? "text-foreground" : "text-muted-foreground/40"}`} />
      </span>
    </TableHead>
  );

  if (loading && !data) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[340px]" />
        <Skeleton className="h-[340px]" />
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        No staff performance data for the selected period
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHead label="Teller" col="userName" />
                <SortableHead label="Served" col="ticketsServed" />
                <SortableHead label="Avg Service" col="avgServiceTimeSec" />
                <SortableHead label="No-Shows" col="noShowCount" />
                <SortableHead label="No-Show %" col="noShowRate" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((s) => (
                <TableRow key={s.userId}>
                  <TableCell className="font-medium">{s.userName}</TableCell>
                  <TableCell className="tabular-nums">{s.ticketsServed}</TableCell>
                  <TableCell className="tabular-nums">{fmtDuration(s.avgServiceTimeSec)}</TableCell>
                  <TableCell className="tabular-nums">{s.noShowCount}</TableCell>
                  <TableCell className="tabular-nums">{fmtPct(s.noShowRate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Service Time Comparison Chart */}
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-medium">Service Time by Teller (Top 10)</h3>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart
            data={top10}
            layout="vertical"
            margin={{ top: 4, right: 4, bottom: 0, left: 4 }}
          >
            <defs>
              <linearGradient id="staffBarGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--color-avgServiceTimeSec)" stopOpacity={0.5} />
                <stop offset="100%" stopColor="var(--color-avgServiceTimeSec)" stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid horizontal={false} strokeDasharray="3 3" className="opacity-40" />
            <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={72}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="avgServiceTimeSec"
              fill="url(#staffBarGrad)"
              radius={[0, 4, 4, 0]}
              barSize={18}
            />
          </BarChart>
        </ChartContainer>
      </Card>
    </div>
  );
}
