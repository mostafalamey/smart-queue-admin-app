/* ── Analytics API response types ──────────────────────────────────────────── */

export interface AnalyticsFilters {
  from: string;          // ISO date string
  to: string;            // ISO date string
  departmentId?: string;
  serviceId?: string;
  granularity?: "hourly" | "daily" | "weekly";
  metric?: TrendMetric;
}

export type TrendMetric =
  | "waitTime"
  | "serviceTime"
  | "volume"
  | "throughput"
  | "noShowRate"
  | "completionRate";

export type TimePreset =
  | "today"
  | "yesterday"
  | "thisWeek"
  | "thisMonth"
  | "last30"
  | "custom";

/* ── Dashboard KPIs ──────────────────────────────────────────────────────── */

export interface DashboardKPIs {
  ticketsIssued: number;
  ticketsServed: number;
  currentlyWaiting: number;
  currentlyServing: number;
  avgWaitTimeSec: number;
  avgServiceTimeSec: number;
  noShowCount: number;
  noShowRate: number;
  completionRate: number;
  transferCount: number;
  transferRate: number;
  cancellationCount: number;
  cancellationRate: number;
}

export interface DashboardResponse {
  current: DashboardKPIs;
  previous: DashboardKPIs;
}

/* ── Trends ──────────────────────────────────────────────────────────────── */

export interface TrendPoint {
  period: string;
  value: number;
}

/* ── Department comparison ───────────────────────────────────────────────── */

export interface DepartmentComparison {
  departmentId: string;
  departmentNameEn: string;
  departmentNameAr: string;
  avgWaitTimeSec: number;
  avgServiceTimeSec: number;
  ticketCount: number;
  completionRate: number;
  noShowRate: number;
}

/* ── Service distribution ────────────────────────────────────────────────── */

export interface ServiceDistribution {
  serviceId: string;
  serviceNameEn: string;
  serviceNameAr: string;
  ticketCount: number;
  percentage: number;
}

/* ── Staff performance ───────────────────────────────────────────────────── */

export interface StaffPerformance {
  userId: string;
  userName: string;
  ticketsServed: number;
  avgServiceTimeSec: number;
  noShowCount: number;
  noShowRate: number;
}

/* ── Transfer analytics ──────────────────────────────────────────────────── */

export interface TransferReasonBreakdown {
  reasonId: string;
  reasonEn: string;
  reasonAr: string;
  count: number;
  percentage: number;
}

export interface TransferFlow {
  fromServiceEn: string;
  toServiceEn: string;
  count: number;
}

export interface TransferAnalytics {
  totalTransfers: number;
  transferRate: number;
  reasonBreakdown: TransferReasonBreakdown[];
  topFlows: TransferFlow[];
}

/* ── Peak patterns ───────────────────────────────────────────────────────── */

export interface PeakPatternCell {
  dayOfWeek: number;   // 0 = Sunday … 6 = Saturday
  hour: number;        // 0–23
  ticketCount: number;
}

/* ── Priority breakdown ──────────────────────────────────────────────────── */

export interface PriorityBreakdown {
  priorityName: string;
  priorityWeight: number;
  count: number;
  avgWaitTimeSec: number;
}

/* ── Department / Service (shared with queue-control) ────────────────────── */

export interface Department {
  id: string;
  nameEn: string;
  nameAr: string;
}

export interface Service {
  id: string;
  nameEn: string;
  nameAr: string;
  ticketPrefix: string;
  estimatedWaitMinutes: number | null;
}
