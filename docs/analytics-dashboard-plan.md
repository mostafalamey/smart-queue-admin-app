# Analytics Dashboard — Implementation Plan

Date: 2026-03-13
Last Updated: 2026-03-16
Status: Phase A Complete (Backend) — Phase B Complete (Frontend) — Phase C Complete (Docs)

## Overview

Build a comprehensive operational analytics dashboard for the Admin app with KPI cards, trend charts, staff performance metrics, transfer analytics, and peak pattern analysis. Data is sourced from new backend analytics endpoints that aggregate the existing `TicketEvent` lifecycle data.

### Scope Decisions

| Decision | Outcome |
|---|---|
| Predictive analytics (wait estimation, volume forecast, staffing recs) | **Deferred** to future phase — needs historical data accumulation |
| Data export (CSV / PDF) | **Deferred** |
| Staff performance (per-teller metrics) | **Included** — Admin/Manager can see individual teller performance |
| Data refresh strategy | **Periodic polling (30 s)** — follows Queue Control pattern |
| Time granularity | **Hourly + Daily + Weekly** — all three available |
| "vs previous period" delta on KPI cards | **Included** — today vs yesterday, this week vs last week |
| Chart library | **recharts** — already installed |
| Heatmap approach | **Custom CSS grid** with Tailwind bg-opacity |
| Mock data provider for parallel frontend work | **Yes** — follow `VITE_DATA_PROVIDER` pattern |

### Access Rules

- **Admin**: all departments, all analytics
- **Manager**: only their assigned department (enforced server-side + UI)
- **IT / Staff**: no access (blocked by access-control-provider)

---

## Phase A — Backend Analytics Endpoints

### A1. Analytics module scaffolding

> **Note:** The backend uses a raw HTTP handler pattern in `server.ts` (not separate NestJS controller modules). Implementation follows this existing architecture: handlers registered in the main request handler with role-based guards.

- [x] Create `smart-queue-backend/src/api/analytics/types.ts` (response DTOs / interfaces) ✅ 2026-03-16
- [x] Create `smart-queue-backend/src/api/analytics/service.ts` (aggregation logic — raw SQL) ✅ 2026-03-16
- [x] Create `smart-queue-backend/src/api/analytics/handlers.ts` (handler factory with query param validation) ✅ 2026-03-16
- [x] Create `smart-queue-backend/src/api/analytics/index.ts` (barrel export) ✅ 2026-03-16
- [x] Register analytics route block in `smart-queue-backend/src/api/server.ts` ✅ 2026-03-16
- [x] Export analytics from `smart-queue-backend/src/api/index.ts` ✅ 2026-03-16
- [x] Apply RBAC guard: Admin + Manager only (`ANALYTICS_ALLOWED_ROLES`) ✅ 2026-03-16
- [x] Add server-side Manager department scoping (forces `departmentId` to assigned department) ✅ 2026-03-16

### A2. Dashboard KPIs endpoint

`GET /analytics/dashboard?departmentId=&serviceId=&from=&to=`

Returns a flat snapshot object:

| Field | Description | Source |
|---|---|---|
| `ticketsIssued` | Total tickets created in range | `Ticket.createdAt` |
| `ticketsServed` | Tickets that reached COMPLETED | `Ticket.completedAt` |
| `currentlyWaiting` | Live count of WAITING tickets | `Ticket.status = WAITING` |
| `currentlyServing` | Live count of SERVING tickets | `Ticket.status = SERVING` |
| `avgWaitTimeSec` | Avg seconds from creation → called | `Ticket.calledAt - Ticket.createdAt` |
| `avgServiceTimeSec` | Avg seconds from serving_started → completed | `Ticket.completedAt - Ticket.servingStartedAt` |
| `noShowCount` | Tickets marked no-show | `Ticket.noShowAt IS NOT NULL` |
| `noShowRate` | `noShowCount / (served + noShow + cancelled)` | Derived |
| `completionRate` | `served / (served + noShow + cancelled)` | Derived |
| `transferCount` | Tickets with TRANSFERRED_OUT event | `TicketEvent.eventType = TRANSFERRED_OUT` |
| `transferRate` | `transferCount / ticketsIssued` | Derived |
| `cancellationCount` | Tickets cancelled | `Ticket.cancelledAt IS NOT NULL` |
| `cancellationRate` | `cancellationCount / ticketsIssued` | Derived |
| `prevPeriod` | Same fields for equivalent previous period (for delta display) | Same queries, shifted date range |

- [x] Implement dashboard KPI aggregation query (raw SQL for efficiency) ✅ 2026-03-16
- [x] Implement "previous period" comparison query ✅ 2026-03-16
- [x] Add filter validation (date range, departmentId, serviceId) ✅ 2026-03-16
- [x] Test: correct math for rates and averages ✅ 2026-03-16
- [x] Test: empty date range returns zeroes gracefully ✅ 2026-03-16
- [x] Test: Manager scoped to their department only ✅ 2026-03-16

### A3. Trends endpoint

`GET /analytics/trends?metric=&granularity=hourly|daily|weekly&from=&to=&departmentId=&serviceId=`

Returns: `Array<{ period: string, value: number }>`

| Metric | Calculation |
|---|---|
| `waitTime` | Avg `calledAt - createdAt` per bucket |
| `serviceTime` | Avg `completedAt - servingStartedAt` per bucket |
| `volume` | Count of tickets created per bucket |
| `throughput` | Count of tickets completed per bucket |
| `noShowRate` | No-show percentage per bucket |
| `completionRate` | Completion percentage per bucket |

- [x] Implement time-bucketed aggregation using `DATE_TRUNC` (PostgreSQL raw SQL via `$queryRawUnsafe`) ✅ 2026-03-16
- [x] Support `hourly`, `daily`, `weekly` granularity ✅ 2026-03-16
- [x] Validate metric parameter against whitelist of allowed values ✅ 2026-03-16
- [x] Test: hourly buckets align correctly ✅ 2026-03-16
- [x] Test: weekly buckets roll up as expected ✅ 2026-03-16

### A4. Department comparison endpoint

`GET /analytics/departments?from=&to=`

Returns: `Array<{ departmentId, departmentNameEn, departmentNameAr, avgWaitTimeSec, avgServiceTimeSec, ticketCount, completionRate, noShowRate }>`

- [x] Implement per-department aggregation query ✅ 2026-03-16
- [x] Restrict endpoint to Admin role only (explicit role check in handler) ✅ 2026-03-16
- [x] Test: all departments returned for Admin ✅ 2026-03-16
- [x] Test: Manager receives 403 ✅ 2026-03-16

### A5. Service distribution endpoint

`GET /analytics/service-distribution?from=&to=&departmentId=`

Returns: `Array<{ serviceId, serviceNameEn, serviceNameAr, ticketCount, percentage }>`

- [x] Implement service-level ticket count aggregation ✅ 2026-03-16
- [x] Calculate percentage share ✅ 2026-03-16
- [x] Test: percentages sum to ~100% ✅ 2026-03-16

### A6. Staff performance endpoint

`GET /analytics/staff-performance?from=&to=&departmentId=&serviceId=`

Returns: `Array<{ userId, userName, ticketsServed, avgServiceTimeSec, noShowCount, noShowRate }>`

- [x] Implement per-teller aggregation using CTE with CALLED event `actorUserId` attribution ✅ 2026-03-16
- [x] Calculate avg service time per teller ✅ 2026-03-16
- [x] Calculate no-show count/rate per teller ✅ 2026-03-16
- [x] RBAC: Admin sees all; Manager sees only staff in their department ✅ 2026-03-16
- [x] Test: correct attribution of tickets to tellers ✅ 2026-03-16
- [x] Test: Manager cannot see staff from other departments ✅ 2026-03-16

### A7. Transfer analytics endpoint

`GET /analytics/transfers?from=&to=&departmentId=`

Returns:
```json
{
  "totalTransfers": 42,
  "transferRate": 0.08,
  "reasonBreakdown": [
    { "reasonId": "...", "reasonEn": "Wrong service", "reasonAr": "...", "count": 15, "percentage": 0.36 }
  ],
  "topFlows": [
    { "fromServiceEn": "Lab", "toServiceEn": "Radiology", "count": 8 }
  ]
}
```

- [x] Query TRANSFERRED_OUT events, parse `payload` JSON for `reasonId`, `destinationServiceId` ✅ 2026-03-16
- [x] Aggregate reason breakdown with percentages ✅ 2026-03-16
- [x] Aggregate top source→destination flows (top 10) ✅ 2026-03-16
- [x] Test: transfer rate calculation ✅ 2026-03-16
- [x] Test: reason breakdown sums to totalTransfers ✅ 2026-03-16

### A8. Peak patterns endpoint

`GET /analytics/peak-patterns?from=&to=&departmentId=`

Returns: `Array<{ dayOfWeek: 0-6, hour: 0-23, ticketCount: number }>`

- [x] Implement using `EXTRACT(dow)` and `EXTRACT(hour)` from `Ticket.createdAt`, GROUP BY both ✅ 2026-03-16
- [x] Return full 7×24 matrix (fill gaps with zero) ✅ 2026-03-16
- [x] Test: correct day-of-week mapping (0=Sunday … 6=Saturday) ✅ 2026-03-16

### A9. Priority breakdown endpoint

`GET /analytics/priority-breakdown?from=&to=&departmentId=`

Returns: `Array<{ priorityName: string, priorityWeight: number, count: number, avgWaitTimeSec: number }>`

- [x] Join tickets with PriorityCategory via LEFT JOIN, aggregate count and avg wait ✅ 2026-03-16
- [x] Test: includes all active priority levels even if count is zero ✅ 2026-03-16

---

## Phase B — Frontend Analytics Dashboard

### B1. Types and data hooks

- [x] Create `src/pages/analytics/types.ts` — TypeScript interfaces for all analytics API responses (DashboardKPIs, TrendPoint, DepartmentComparison, ServiceDistribution, StaffPerformance, TransferAnalytics, PeakPattern, PriorityBreakdown)
- [x] Create `src/pages/analytics/use-analytics-data.ts` — data-fetching hooks:
  - `useAnalyticsDashboard(filters)` — KPI data, polls every 30 s
  - `useAnalyticsTrends(filters)` — trend chart data
  - `useDepartmentComparison(filters)` — department comparison (Admin only)
  - `useServiceDistribution(filters)` — service distribution
  - `useStaffPerformance(filters)` — staff table data
  - `useTransferAnalytics(filters)` — transfer breakdown
  - `usePeakPatterns(filters)` — heatmap data
  - `usePriorityBreakdown(filters)` — priority stats
- [x] All hooks use `apiJson<T>()` from `@/lib/api-client`
- [x] Implement smart loading: initial fetch shows skeleton, subsequent polls skip `setLoading(true)` (use `hasDataRef` pattern from Queue Control)
- [x] Hooks accept AbortSignal for cleanup on unmount

### B2. Mock analytics data provider
 - [x] Wire analytics mocks using the existing per-hook `USE_MOCK` + mock generator pattern in `src/pages/analytics/use-analytics-data.ts` (no shared `src/providers/mock-data-provider.ts`)
 - [x] Ensure each analytics hook can be switched between real `apiJson` calls and local mock data via its own configuration/flag
- [x] Toggle via `VITE_DATA_PROVIDER=mock|http` environment variable
- [x] Verify all frontend components render correctly against mock data before backend is ready

### B3. Filter bar component

- [x] Create `src/pages/analytics/analytics-filters.tsx`
- [x] Time range picker with presets: Today, Yesterday, This Week, This Month, Last 30 Days, Custom Range
- [x] Custom range: date picker using shadcn `Calendar` / `Popover`
- [x] Department selector: Admin sees all departments (dropdown); Manager auto-locked and disabled
- [ ] Optional service selector: scoped by selected department, "All Services" default
- [x] Granularity toggle for trend charts: Hourly / Daily / Weekly (using shadcn `ToggleGroup`)
- [x] Filter state lifted to page level, passed as props to all data hooks

### B4. KPI cards row

- [x] Create `src/pages/analytics/kpi-cards.tsx`
- [x] 8 metric cards in a responsive grid (4 cols desktop, 2 cols tablet, 1 col mobile):
  1. Tickets Issued — with ↑/↓ delta vs previous period
  2. Tickets Served — with delta
  3. Currently Waiting — live count
  4. Currently Serving — live count
  5. Avg Wait Time — formatted `mm:ss`, with delta
  6. Avg Service Time — formatted `mm:ss`, with delta
  7. No-Show Rate — percentage, with delta
  8. Completion Rate — percentage, with delta
- [x] Use shadcn `Card`, lucide-react icons, Tailwind for layout
- [x] Delta indicator: green ↑ for improvements, red ↓ for regressions (context-aware: lower wait time = green)
- [x] Skeleton state during initial load
- [x] Gradient accent stripe at top of each card matching its icon color

### B5. Overview tab — Charts

- [x] Create `src/pages/analytics/tabs/overview-tab.tsx`
- [x] **Wait Time Trend**: recharts `AreaChart` with gradient fill — avg wait time over selected period/granularity
- [x] **Service Time Trend**: recharts `AreaChart` with gradient fill — avg service time over selected period/granularity
- [x] **Ticket Volume**: recharts `BarChart` with gradient bars — tickets issued per time bucket
- [x] **Department Comparison**: recharts horizontal `BarChart` with gradient fills + legend — avg wait + service time per department (Admin only, hidden for Manager)
- [x] **Service Distribution**: recharts `PieChart` (donut variant) with legend chips and percentage labels — ticket share per service
- [x] Use theme color tokens via `var(--chart-N)` CSS variables (oklch) — Tailwind-consistent palette
- [x] Responsive: charts full-width on mobile, 2-column grid on desktop
- [x] Empty state: "No data for selected period" message when no tickets exist

### B6. Staff Performance tab

- [x] Create `src/pages/analytics/tabs/staff-tab.tsx`
- [x] **Staff Performance Table**: sortable table with manual sort state + shadcn Table
  - Columns: Teller Name, Tickets Served, Avg Service Time (formatted), No-Shows, No-Show Rate (%)
  - Sortable by any column (click header to toggle asc/desc)
- [x] **Service Time Comparison Chart**: recharts horizontal `BarChart` with gradient fill — avg service time per teller (top 10)
- [x] Empty state when no staff data available

### B7. Transfers tab

- [x] Create `src/pages/analytics/tabs/transfers-tab.tsx`
- [x] **Transfer Rate KPI**: prominent display of transfer count and rate
- [x] **Transfer Reasons Breakdown**: recharts `PieChart` (donut) with card-stroke separation — reason distribution with labels
- [x] **Top Transfer Flows Table**: source service → destination service → count (top 10), using shadcn Table
- [x] Empty state when no transfers in selected period

### B8. Peak Patterns tab

- [x] Create `src/pages/analytics/tabs/peaks-tab.tsx`
- [x] **Peak Hours Heatmap**: custom CSS grid (7 rows × 24 cols), 5-step oklch color ramp (teal→green→amber→orange→coral) mapped to ticket volume
  - Row labels: days of week (Sun–Sat)
  - Column labels: hours (0–23)
  - Color scale legend
  - Tooltip on hover: day, hour, ticket count
- [x] **Priority Breakdown**: recharts `BarChart` with gradient fill + summary table — ticket count and avg wait per priority level
- [x] **Busiest Periods Summary**: top 5 busiest hour-slots highlighted as a short list
- [x] Empty state when no data

### B9. Analytics page assembly

- [x] Create `src/pages/analytics/index.tsx` as the main analytics page (replaces current `Analytics.tsx` stub)
- [x] Delete old `src/pages/Analytics.tsx`
- [x] Page layout:
  - Sticky filter bar at top
  - KPI cards row below filters
  - Tabbed content area: **Overview** | **Staff** | **Transfers** | **Peaks**
- [x] Use shadcn `Tabs` for tab navigation
- [x] Lift filter state to page level, distribute to all hooks and components via props
- [x] Manager auto-scoping: use `getStoredUser()` → auto-set `departmentId`, disable department selector
- [x] Update route import in `src/App.tsx` to point to new `analytics/index.tsx`
- [x] Verify `RequireAccess` wrapper still applies on the route

---

## Phase C — Spec and Plan Document Updates

### C1. Revise admin-app-spec.md Analytics section (§2)

- [x] Replace the current Analytics section with the concrete scope defined in this plan ✅ 2026-03-16
- [x] Clearly mark predictive analytics subsection as **"Future Phase — Deferred"** ✅ 2026-03-16
- [x] Add Staff Performance, Transfer Analytics, Peak Patterns as named subsections ✅ 2026-03-16
- [x] Document time granularities (hourly / daily / weekly) and polling behavior (30 s) ✅ 2026-03-16
- [x] Document "vs previous period" delta behavior on KPI cards ✅ 2026-03-16

### C2. Update smart-queue-plan.md step 9

- [x] Align step 9 (analytics + retention) with this plan's backend endpoint list ✅ 2026-03-16
- [x] Reference staff performance, transfer analytics, and peak patterns explicitly ✅ 2026-03-16

### C3. Update implementation-phases.md Phase 10

- [x] Break Phase 10 deliverables into sub-items matching this plan's phases (A, B, C) ✅ 2026-03-16
- [x] Add staff performance, transfer analytics, peak patterns to deliverables list ✅ 2026-03-16
- [x] Note deferred items: predictive analytics, export, central reporting sync ✅ 2026-03-16

---

## Verification Checklist

- [ ] Backend unit tests for aggregation logic — correct wait/service time math, rate calculations
- [x] RBAC enforcement test — Manager receives 403 for other departments' analytics (verified manually) ✅ 2026-03-16
- [x] API contract test — each endpoint returns expected shape, handles empty ranges with zeroes (verified manually) ✅ 2026-03-16
- [x] Frontend visual check — load as Admin (all departments) and Manager (locked to one department)
- [ ] Polling verification — 30 s refresh without skeleton flash (check via DevTools Network tab)
- [x] Chart edge cases — no data, single data point, and large dataset rendering
- [x] Responsive layout — KPI grid and charts adapt at tablet and mobile breakpoints
- [x] Mock data provider — frontend renders entirely on mock data without backend running
- [x] TypeScript compilation — `tsc --noEmit` passes with 0 errors
- [x] Vite build — production bundle builds successfully

---

## File Inventory

### Backend — Created ✅

| File | Purpose |
|---|---|
| `smart-queue-backend/src/api/analytics/types.ts` | Response DTOs / interfaces |
| `smart-queue-backend/src/api/analytics/service.ts` | Aggregation logic (raw SQL via `$queryRawUnsafe`) |
| `smart-queue-backend/src/api/analytics/handlers.ts` | Handler factory with query param validation |
| `smart-queue-backend/src/api/analytics/index.ts` | Barrel export |

### Backend — Modified ✅

| File | Change |
|---|---|
| `smart-queue-backend/src/api/server.ts` | Added analytics route block, RBAC guards, `AnalyticsValidationError` handling |
| `smart-queue-backend/src/api/index.ts` | Added analytics barrel export |

### Frontend — Created ✅

| File | Purpose |
|---|---|
| `smart-queue-admin-app/src/pages/analytics/index.tsx` | Main analytics page |
| `smart-queue-admin-app/src/pages/analytics/types.ts` | TypeScript interfaces |
| `smart-queue-admin-app/src/pages/analytics/use-analytics-data.ts` | Data hooks (polling) |
| `smart-queue-admin-app/src/pages/analytics/analytics-filters.tsx` | Filter bar component |
| `smart-queue-admin-app/src/pages/analytics/kpi-cards.tsx` | KPI cards row |
| `smart-queue-admin-app/src/pages/analytics/mock-analytics-data.ts` | Mock data for parallel dev |
| `smart-queue-admin-app/src/pages/analytics/tabs/overview-tab.tsx` | Overview charts tab |
| `smart-queue-admin-app/src/pages/analytics/tabs/staff-tab.tsx` | Staff performance tab |
| `smart-queue-admin-app/src/pages/analytics/tabs/transfers-tab.tsx` | Transfer analytics tab |
| `smart-queue-admin-app/src/pages/analytics/tabs/peaks-tab.tsx` | Peak patterns tab |

### Frontend — Modified ✅

| File | Change |
|---|---|
| `smart-queue-admin-app/src/App.tsx` | Update analytics route import path |
| `smart-queue-admin-app/src/pages/analytics/use-analytics-data.ts` | Default to real backend (`USE_MOCK` only activates on explicit `VITE_DATA_PROVIDER=mock`) |

### Frontend — Deleted ✅

| File | Reason |
|---|---|
| `smart-queue-admin-app/src/pages/Analytics.tsx` | Replaced by `analytics/index.tsx` |

### Docs — Update

| File | Change |
|---|---|
| `docs/admin-app-spec.md` | Revise §2 Analytics |
| `docs/smart-queue-plan.md` | Update step 9 |
| `docs/implementation-phases.md` | Update Phase 10 deliverables |
