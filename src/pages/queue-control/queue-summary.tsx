import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Clock,
  PhoneCall,
  UserCheck,
  CircleCheckBig,
  UserX,
} from "lucide-react";
import type { QueueSummary } from "./types";

interface Props {
  summary: QueueSummary | null;
  loading: boolean;
}

const STATS = [
  {
    key: "waitingCount" as const,
    label: "Waiting",
    icon: Clock,
    accent: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
  },
  {
    key: "calledCount" as const,
    label: "Called",
    icon: PhoneCall,
    accent: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40",
  },
  {
    key: "servingCount" as const,
    label: "Serving",
    icon: UserCheck,
    accent: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
  },
  {
    key: "completedToday" as const,
    label: "Completed",
    icon: CircleCheckBig,
    accent: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/40",
  },
  {
    key: "noShowsToday" as const,
    label: "No-Show",
    icon: UserX,
    accent: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/40",
  },
];

export function QueueSummaryCards({ summary, loading }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {STATS.map(({ key, label, icon: Icon, accent, bg }) => (
        <Card key={key} className="relative overflow-hidden p-4">
          <div className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-md ${bg}`}>
              <Icon className={`h-3.5 w-3.5 ${accent}`} />
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {label}
            </span>
          </div>
          {loading && !summary ? (
            <Skeleton className="mt-3 h-8 w-14" />
          ) : (
            <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">
              {summary ? summary[key] : "—"}
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}
