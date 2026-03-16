/**
 * Mock analytics data for frontend development without backend.
 *
 * All generators accept the same AnalyticsFilters shape so the hooks can
 * forward the current filter state and get varied (but deterministic) data.
 */

import type {
  AnalyticsFilters,
  DashboardResponse,
  DepartmentComparison,
  PeakPatternCell,
  PriorityBreakdown,
  ServiceDistribution,
  StaffPerformance,
  TransferAnalytics,
  TrendPoint,
} from "./types";

/* ── helpers ─────────────────────────────────────────────────────────────── */

function seeded(seed: number) {
  // Simple deterministic PRNG so data stays stable across re-renders
  return () => {
    seed = (seed * 16807 + 0) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function fmtHour(d: Date): string {
  return `${d.toISOString().slice(0, 13)}:00`;
}

function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

/* ── Dashboard KPIs ──────────────────────────────────────────────────────── */

export function mockDashboard(_f?: AnalyticsFilters): DashboardResponse {
  return {
    current: {
      ticketsIssued: 284,
      ticketsServed: 231,
      currentlyWaiting: 18,
      currentlyServing: 6,
      avgWaitTimeSec: 462,
      avgServiceTimeSec: 318,
      noShowCount: 23,
      noShowRate: 0.081,
      completionRate: 0.892,
      transferCount: 14,
      transferRate: 0.049,
      cancellationCount: 16,
      cancellationRate: 0.056,
    },
    previous: {
      ticketsIssued: 261,
      ticketsServed: 218,
      currentlyWaiting: 12,
      currentlyServing: 5,
      avgWaitTimeSec: 510,
      avgServiceTimeSec: 335,
      noShowCount: 28,
      noShowRate: 0.107,
      completionRate: 0.867,
      transferCount: 11,
      transferRate: 0.042,
      cancellationCount: 15,
      cancellationRate: 0.057,
    },
  };
}

/* ── Trends ──────────────────────────────────────────────────────────────── */

export function mockTrends(f?: AnalyticsFilters): TrendPoint[] {
  const gran = f?.granularity ?? "daily";
  const rand = seeded(42);
  const points: TrendPoint[] = [];

  if (gran === "hourly") {
    const base = new Date();
    base.setHours(7, 0, 0, 0);
    for (let h = 0; h < 12; h++) {
      const d = new Date(base);
      d.setHours(base.getHours() + h);
      points.push({ period: fmtHour(d), value: Math.round(200 + rand() * 400) });
    }
  } else if (gran === "weekly") {
    const base = new Date();
    for (let w = 6; w >= 0; w--) {
      const d = addDays(base, -w * 7);
      points.push({ period: `W${fmtDate(d)}`, value: Math.round(180 + rand() * 350) });
    }
  } else {
    const base = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = addDays(base, -i);
      points.push({ period: fmtDate(d), value: Math.round(150 + rand() * 500) });
    }
  }

  return points;
}

/* ── Department comparison ───────────────────────────────────────────────── */

export function mockDepartments(_f?: AnalyticsFilters): DepartmentComparison[] {
  return [
    { departmentId: "d1", departmentNameEn: "Outpatient Clinic", departmentNameAr: "العيادات الخارجية", avgWaitTimeSec: 420, avgServiceTimeSec: 300, ticketCount: 98, completionRate: 0.91, noShowRate: 0.06 },
    { departmentId: "d2", departmentNameEn: "Laboratory", departmentNameAr: "المختبر", avgWaitTimeSec: 380, avgServiceTimeSec: 180, ticketCount: 75, completionRate: 0.94, noShowRate: 0.04 },
    { departmentId: "d3", departmentNameEn: "Radiology", departmentNameAr: "الأشعة", avgWaitTimeSec: 540, avgServiceTimeSec: 420, ticketCount: 52, completionRate: 0.88, noShowRate: 0.1 },
    { departmentId: "d4", departmentNameEn: "Pharmacy", departmentNameAr: "الصيدلية", avgWaitTimeSec: 240, avgServiceTimeSec: 120, ticketCount: 130, completionRate: 0.96, noShowRate: 0.02 },
    { departmentId: "d5", departmentNameEn: "Emergency", departmentNameAr: "الطوارئ", avgWaitTimeSec: 180, avgServiceTimeSec: 600, ticketCount: 44, completionRate: 0.84, noShowRate: 0.12 },
  ];
}

/* ── Service distribution ────────────────────────────────────────────────── */

export function mockServiceDistribution(_f?: AnalyticsFilters): ServiceDistribution[] {
  return [
    { serviceId: "s1", serviceNameEn: "General Consultation", serviceNameAr: "استشارة عامة", ticketCount: 82, percentage: 29.5 },
    { serviceId: "s2", serviceNameEn: "Blood Test", serviceNameAr: "فحص دم", ticketCount: 65, percentage: 23.4 },
    { serviceId: "s3", serviceNameEn: "X-Ray", serviceNameAr: "أشعة سينية", ticketCount: 48, percentage: 17.3 },
    { serviceId: "s4", serviceNameEn: "Prescription Pickup", serviceNameAr: "صرف أدوية", ticketCount: 54, percentage: 19.4 },
    { serviceId: "s5", serviceNameEn: "Follow-up Visit", serviceNameAr: "زيارة متابعة", ticketCount: 29, percentage: 10.4 },
  ];
}

/* ── Staff performance ───────────────────────────────────────────────────── */

export function mockStaffPerformance(_f?: AnalyticsFilters): StaffPerformance[] {
  return [
    { userId: "u1", userName: "Ahmed Hassan", ticketsServed: 42, avgServiceTimeSec: 285, noShowCount: 3, noShowRate: 0.067 },
    { userId: "u2", userName: "Fatima Al-Rashid", ticketsServed: 38, avgServiceTimeSec: 310, noShowCount: 2, noShowRate: 0.05 },
    { userId: "u3", userName: "Omar Khalil", ticketsServed: 35, avgServiceTimeSec: 264, noShowCount: 5, noShowRate: 0.125 },
    { userId: "u4", userName: "Layla Nasser", ticketsServed: 41, avgServiceTimeSec: 342, noShowCount: 1, noShowRate: 0.024 },
    { userId: "u5", userName: "Yusuf Ibrahim", ticketsServed: 33, avgServiceTimeSec: 298, noShowCount: 4, noShowRate: 0.108 },
    { userId: "u6", userName: "Noor Al-Sayed", ticketsServed: 28, avgServiceTimeSec: 275, noShowCount: 2, noShowRate: 0.067 },
    { userId: "u7", userName: "Khalid Mansour", ticketsServed: 31, avgServiceTimeSec: 356, noShowCount: 6, noShowRate: 0.162 },
    { userId: "u8", userName: "Sara Abdallah", ticketsServed: 37, avgServiceTimeSec: 290, noShowCount: 0, noShowRate: 0.0 },
  ];
}

/* ── Transfer analytics ──────────────────────────────────────────────────── */

export function mockTransfers(_f?: AnalyticsFilters): TransferAnalytics {
  return {
    totalTransfers: 14,
    transferRate: 0.049,
    reasonBreakdown: [
      { reasonId: "r1", reasonEn: "Wrong service", reasonAr: "خدمة خاطئة", count: 5, percentage: 35.7 },
      { reasonId: "r2", reasonEn: "Doctor referral", reasonAr: "تحويل طبيب", count: 4, percentage: 28.6 },
      { reasonId: "r3", reasonEn: "Additional tests required", reasonAr: "فحوصات إضافية", count: 3, percentage: 21.4 },
      { reasonId: "r4", reasonEn: "Specialist consultation", reasonAr: "استشارة متخصصة", count: 2, percentage: 14.3 },
    ],
    topFlows: [
      { fromServiceEn: "General Consultation", toServiceEn: "Blood Test", count: 4 },
      { fromServiceEn: "General Consultation", toServiceEn: "X-Ray", count: 3 },
      { fromServiceEn: "Blood Test", toServiceEn: "General Consultation", count: 2 },
      { fromServiceEn: "X-Ray", toServiceEn: "General Consultation", count: 2 },
      { fromServiceEn: "Follow-up Visit", toServiceEn: "Blood Test", count: 1 },
      { fromServiceEn: "General Consultation", toServiceEn: "Prescription Pickup", count: 1 },
      { fromServiceEn: "Blood Test", toServiceEn: "X-Ray", count: 1 },
    ],
  };
}

/* ── Peak patterns ───────────────────────────────────────────────────────── */

export function mockPeakPatterns(_f?: AnalyticsFilters): PeakPatternCell[] {
  const rand = seeded(99);
  const cells: PeakPatternCell[] = [];

  // Sunday–Saturday peaks weighted toward weekday mornings
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      let base = 0;
      if (hour >= 7 && hour <= 14) base = 15;
      else if (hour >= 15 && hour <= 18) base = 8;
      else if (hour >= 5 && hour <= 6) base = 3;

      // Weekdays (Mon–Thu = 1–4) are busier
      if (day >= 1 && day <= 4) base = Math.round(base * 1.4);
      // Friday lower
      if (day === 5) base = Math.round(base * 0.6);
      // Saturday moderate
      if (day === 6) base = Math.round(base * 0.9);

      const count = Math.max(0, Math.round(base + rand() * 8 - 2));
      cells.push({ dayOfWeek: day, hour, ticketCount: count });
    }
  }

  return cells;
}

/* ── Priority breakdown ──────────────────────────────────────────────────── */

export function mockPriorityBreakdown(_f?: AnalyticsFilters): PriorityBreakdown[] {
  return [
    { priorityName: "Normal", priorityWeight: 0, count: 218, avgWaitTimeSec: 510 },
    { priorityName: "VIP", priorityWeight: 10, count: 42, avgWaitTimeSec: 240 },
    { priorityName: "Emergency", priorityWeight: 20, count: 24, avgWaitTimeSec: 96 },
  ];
}
