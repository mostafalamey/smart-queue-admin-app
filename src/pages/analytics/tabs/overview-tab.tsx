import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
  AreaChart,
  Legend,
} from "recharts";
import { useEffect } from "react";
import { toast } from "sonner";
import type {
  AnalyticsFilters,
  TrendPoint,
  DepartmentComparison,
  ServiceDistribution,
} from "../types";
import {
  useTrends,
  useDepartmentComparison,
  useServiceDistribution,
} from "../use-analytics-data";

/* ── Chart configs ───────────────────────────────────────────────────────── */

const waitTimeConfig: ChartConfig = {
  value: { label: "Avg Wait (sec)", color: "var(--chart-1)" },
};

const serviceTimeConfig: ChartConfig = {
  value: { label: "Avg Service (sec)", color: "var(--chart-2)" },
};

const volumeConfig: ChartConfig = {
  value: { label: "Tickets", color: "var(--chart-3)" },
};

const pieColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "oklch(0.58 0.16 250)",
  "oklch(0.62 0.15 155)",
  "oklch(0.68 0.14 45)",
];

const deptConfig: ChartConfig = {
  avgWaitTimeSec: { label: "Avg Wait (sec)", color: "var(--chart-1)" },
  avgServiceTimeSec: { label: "Avg Service (sec)", color: "var(--chart-2)" },
};

/* ── Label formatters ────────────────────────────────────────────────────── */

function shortPeriod(period: string): string {
  if (period.startsWith("W")) return "W" + period.slice(6); // W2026-03-16 → W03-16
  if (period.includes("T")) return period.slice(11, 16);    // 2026-03-16T14:00:00Z → 14:00
  return period.slice(5);                                    // 2026-03-16 → 03-16
}

function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ── Props ───────────────────────────────────────────────────────────────── */

interface Props {
  filters: AnalyticsFilters;
  isAdmin: boolean;
}

/* ── Component ───────────────────────────────────────────────────────────── */

export function OverviewTab({ filters, isAdmin }: Props) {
  const waitFilters = { ...filters, metric: "waitTime" as const };
  const svcFilters = { ...filters, metric: "serviceTime" as const };
  const volFilters = { ...filters, metric: "volume" as const };

  const { data: waitData, loading: waitLoading, error: waitError } = useTrends(waitFilters);
  const { data: svcData, loading: svcLoading, error: svcError } = useTrends(svcFilters);
  const { data: volData, loading: volLoading, error: volError } = useTrends(volFilters);
  const { data: deptData, loading: deptLoading, error: deptError } = useDepartmentComparison(filters, isAdmin);
  const { data: distData, loading: distLoading, error: distError } = useServiceDistribution(filters);

  useEffect(() => { if (waitError) toast.error(waitError); }, [waitError]);
  useEffect(() => { if (svcError) toast.error(svcError); }, [svcError]);
  useEffect(() => { if (volError) toast.error(volError); }, [volError]);
  useEffect(() => { if (deptError) toast.error(deptError); }, [deptError]);
  useEffect(() => { if (distError) toast.error(distError); }, [distError]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Wait Time Trend */}
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-medium">Wait Time Trend</h3>
        {waitLoading && !waitData ? (
          <Skeleton className="h-[220px] w-full" />
        ) : waitData?.length ? (
          <TrendLineChart data={waitData} config={waitTimeConfig} gradientId="waitGrad" />
        ) : (
          <EmptyChart />
        )}
      </Card>

      {/* Service Time Trend */}
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-medium">Service Time Trend</h3>
        {svcLoading && !svcData ? (
          <Skeleton className="h-[220px] w-full" />
        ) : svcData?.length ? (
          <TrendLineChart data={svcData} config={serviceTimeConfig} gradientId="svcGrad" />
        ) : (
          <EmptyChart />
        )}
      </Card>

      {/* Ticket Volume */}
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-medium">Ticket Volume</h3>
        {volLoading && !volData ? (
          <Skeleton className="h-[220px] w-full" />
        ) : volData?.length ? (
          <VolumeBarChart data={volData} />
        ) : (
          <EmptyChart />
        )}
      </Card>

      {/* Service Distribution */}
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-medium">Service Distribution</h3>
        {distLoading && !distData ? (
          <Skeleton className="h-[220px] w-full" />
        ) : distData?.length ? (
          <DistributionPie data={distData} />
        ) : (
          <EmptyChart />
        )}
      </Card>

      {/* Department Comparison (Admin only, full-width) */}
      {isAdmin && (
        <Card className="p-4 lg:col-span-2">
          <h3 className="mb-3 text-sm font-medium">Department Comparison</h3>
          {deptLoading && !deptData ? (
            <Skeleton className="h-[260px] w-full" />
          ) : deptData?.length ? (
            <DepartmentBar data={deptData} />
          ) : (
            <EmptyChart />
          )}
        </Card>
      )}
    </div>
  );
}

/* ── Sub-charts ──────────────────────────────────────────────────────────── */

function TrendLineChart({ data, config, gradientId }: { data: TrendPoint[]; config: ChartConfig; gradientId: string }) {
  return (
    <ChartContainer config={config} className="h-[220px] w-full">
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" className="opacity-40" />
        <XAxis
          dataKey="period"
          tickFormatter={shortPeriod}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={(v: number) => fmtDuration(v)}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={44}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--color-value)"
          strokeWidth={2.5}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--color-value)", fill: "var(--background)" }}
        />
      </AreaChart>
    </ChartContainer>
  );
}

function VolumeBarChart({ data }: { data: TrendPoint[] }) {
  return (
    <ChartContainer config={volumeConfig} className="h-[220px] w-full">
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.9} />
            <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0.4} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" className="opacity-40" />
        <XAxis
          dataKey="period"
          tickFormatter={shortPeriod}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={36} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="value" fill="url(#volumeGrad)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

function DistributionPie({ data }: { data: ServiceDistribution[] }) {
  const config: ChartConfig = Object.fromEntries(
    data.map((d, i) => [d.serviceNameEn, { label: d.serviceNameEn, color: pieColors[i % pieColors.length] }]),
  );

  const total = data.reduce((sum, d) => sum + d.ticketCount, 0);

  return (
    <div className="flex flex-col items-center">
      <ChartContainer config={config} className="mx-auto h-[220px] w-full max-w-[320px]">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent nameKey="serviceNameEn" />} />
          <Pie
            data={data}
            dataKey="ticketCount"
            nameKey="serviceNameEn"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={3}
            strokeWidth={2}
            stroke="var(--card)"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={pieColors[i % pieColors.length]} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      {/* Legend chips */}
      <div className="mt-1 flex flex-wrap justify-center gap-x-3 gap-y-1.5">
        {data.map((d, i) => (
          <div key={d.serviceNameEn} className="flex items-center gap-1.5 text-xs">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: pieColors[i % pieColors.length] }}
            />
            <span className="text-muted-foreground">
              {d.serviceNameEn}
              <span className="ml-1 font-medium text-foreground">
                {total > 0 ? `${((d.ticketCount / total) * 100).toFixed(0)}%` : "0%"}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DepartmentBar({ data }: { data: DepartmentComparison[] }) {
  return (
    <ChartContainer config={deptConfig} className="h-[260px] w-full">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 4, bottom: 0, left: 4 }}
      >
        <defs>
          <linearGradient id="deptWaitGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--color-avgWaitTimeSec)" stopOpacity={0.7} />
            <stop offset="100%" stopColor="var(--color-avgWaitTimeSec)" stopOpacity={1} />
          </linearGradient>
          <linearGradient id="deptSvcGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--color-avgServiceTimeSec)" stopOpacity={0.7} />
            <stop offset="100%" stopColor="var(--color-avgServiceTimeSec)" stopOpacity={1} />
          </linearGradient>
        </defs>
        <CartesianGrid horizontal={false} strokeDasharray="3 3" className="opacity-40" />
        <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="departmentNameEn"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={110}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Legend iconType="circle" iconSize={8} />
        <Bar dataKey="avgWaitTimeSec" name="Avg Wait" fill="url(#deptWaitGrad)" radius={[0, 4, 4, 0]} barSize={14} />
        <Bar dataKey="avgServiceTimeSec" name="Avg Service" fill="url(#deptSvcGrad)" radius={[0, 4, 4, 0]} barSize={14} />
      </BarChart>
    </ChartContainer>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
      No data for selected period
    </div>
  );
}
