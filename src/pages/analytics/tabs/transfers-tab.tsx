import { useEffect } from "react";
import { toast } from "sonner";
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
import { PieChart, Pie, Cell } from "recharts";
import { ArrowRightLeft } from "lucide-react";
import type { AnalyticsFilters } from "../types";
import { useTransferAnalytics } from "../use-analytics-data";

/* ── Colors ──────────────────────────────────────────────────────────────── */

const pieColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "oklch(0.58 0.16 250)",
  "oklch(0.68 0.14 45)",
  "oklch(0.55 0.20 25)",
];

/* ── Props ───────────────────────────────────────────────────────────────── */

interface Props {
  filters: AnalyticsFilters;
}

/* ── Component ───────────────────────────────────────────────────────────── */

export function TransfersTab({ filters }: Props) {
  const { data, loading, error } = useTransferAnalytics(filters);
  useEffect(() => { if (error) toast.error(error); }, [error]);

  if (loading && !data) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[300px]" />
        <Skeleton className="h-[300px]" />
      </div>
    );
  }

  if (!data || data.totalTransfers === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        No transfers recorded for the selected period
      </div>
    );
  }

  const config: ChartConfig = Object.fromEntries(
    data.reasonBreakdown.map((r, i) => [
      r.reasonEn,
      { label: r.reasonEn, color: pieColors[i % pieColors.length] },
    ]),
  );

  return (
    <div className="space-y-4">
      {/* Transfer KPI banner */}
      <div className="flex flex-wrap gap-3">
        <Card className="flex items-center gap-3 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-orange-50 dark:bg-orange-950/40">
            <ArrowRightLeft className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Transfers</p>
            <p className="text-xl font-semibold tabular-nums">{data.totalTransfers}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 px-5 py-4">
          <div>
            <p className="text-xs text-muted-foreground">Transfer Rate</p>
            <p className="text-xl font-semibold tabular-nums">
              {(data.transferRate * 100).toFixed(1)}%
            </p>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Reason Breakdown Pie */}
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-medium">Transfer Reasons</h3>
          <ChartContainer config={config} className="mx-auto h-[250px] w-full max-w-[320px]">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="reasonEn" />} />
              <Pie
                data={data.reasonBreakdown}
                dataKey="count"
                nameKey="reasonEn"
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={85}
                paddingAngle={3}
                strokeWidth={2}
                stroke="var(--card)"
              >
                {data.reasonBreakdown.map((_, i) => (
                  <Cell key={i} fill={pieColors[i % pieColors.length]} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>

          {/* Legend */}
          <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
            {data.reasonBreakdown.map((r, i) => (
              <div key={r.reasonId} className="flex items-center gap-1.5 text-xs">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: pieColors[i % pieColors.length] }}
                />
                <span className="text-muted-foreground">
                  {r.reasonEn} ({(r.percentage * 100).toFixed(0)}%)
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Flows Table */}
        <Card className="overflow-hidden p-0">
          <div className="px-4 pt-4">
            <h3 className="text-sm font-medium">Top Transfer Flows</h3>
          </div>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topFlows.map((f, i) => (
                  <TableRow key={i}>
                    <TableCell>{f.fromServiceEn}</TableCell>
                    <TableCell>{f.toServiceEn}</TableCell>
                    <TableCell className="tabular-nums text-right">{f.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
