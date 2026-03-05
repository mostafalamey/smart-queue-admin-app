# Smart Queue — Admin App Completion Plan

Date: 2026-03-04

---

## Workflow Rules (Non-Negotiable)

1. **Branch per phase** — At the start of each phase, create a feature branch from the current working branch (e.g. `feature/admin-auth`, `feature/admin-rbac`). **Never push directly to `main`.**
2. **Update this document** — At the end of each phase, update this plan: mark all completed todos with ✅ and note the completion date.
3. **Review gate** — After finishing a phase, pause for user review. Do not commit or push until the user explicitly approves.
4. **Commit & push on approval** — Only commit and push to the feature branch when the user says so. Never merge into `main` — merges are handled separately via PR.

---

## Current State Assessment

The admin app has a **production-quality shell** with zero business logic:

| Layer | Status |
|-------|--------|
| Routing & resource declaration (4 top-level tabs, Organization with 5 sub-tabs) | Done |
| Sidebar + header + breadcrumb layout | Done |
| Theme system (light/dark/system) | Done |
| Notification system (Sonner) | Done |
| 46 shadcn/ui primitives | Done |
| Refine CRUD primitives (DataTable, buttons, views) | Done |
| REST data provider (`@refinedev/rest`) | Configured, in use (Queue Control) |
| Auth forms (login, change-password) | ✅ Implemented (Phase A) |
| **Auth provider (Refine `authProvider`)** | ✅ Implemented (Phase A) |
| **Access control provider (RBAC)** | ✅ Implemented (Phase B) |
| **Queue Control page** | ✅ Implemented (Phase C) — full dashboard, search, detail, priority change |
| **WebSocket / realtime integration** | **Not implemented** |
| **i18n (Arabic/English)** | **Not configured** |
| **Organization sub-pages (5 pages)** | **Empty stubs** |
| **User Experience, Analytics pages** | **Empty stubs** |

### Backend Endpoint Availability

| Admin App Need | Backend Status |
|----------------|----------------|
| Auth (login, refresh, change-password) | Available |
| Department/service listing | Available (public) |
| Queue summary + waiting list | Available |
| Admin config: templates, mapping, retention | Available |
| Transfer reasons CRUD | Available |
| Teller operations (call-next, etc.) | Available (not needed in admin app) |
| Realtime WebSocket (queue.updated, now-serving) | Available |
| **Department/service CRUD** | **Not yet built** |
| **User management CRUD** | **Not yet built** |
| **Device registry (list/create devices)** | **Not yet built** |
| **Analytics overview endpoint** | **Not yet built** |
| **Audit log listing** | **Not yet built** |
| Ticket detail lookup by ID | ✅ Available (`GET /admin/tickets/:id`) |
| Ticket search by number/phone | ✅ Available (`GET /admin/tickets/search`) |
| Ticket lock/unlock (admin priority change) | ✅ Available (`POST /admin/tickets/:id/lock`, `/unlock`) |
| Admin priority change | ✅ Available (`POST /admin/tickets/:id/change-priority`) |
| Priority categories listing | ✅ Available (`GET /admin/priority-categories`) |

---

## Completion Phases

### Phase A — Authentication & Session Management ✅
**Goal:** Wire login, token management, and session lifecycle into Refine.

**Priority:** Highest — blocks everything else.

**Completed:** 2026-03-04

**Todos:**
1. ✅ **Create `authProvider`** for Refine that calls `POST /auth/login`, stores JWT access token in memory and refresh token in localStorage, and returns user identity with role. Role enforcement blocks Staff from admin app.
2. ✅ **Wire `<Authenticated>` wrapper** around the `<Layout>` so unauthenticated users redirect to `/login`.
3. ✅ **Create `/login` route** — bespoke login page with Smart Queue branding, error handling (invalid credentials, account locked, rate limit).
4. ✅ **Implement token refresh logic** — intercept 401 responses via mutex pattern in `apiFetch()`, call `POST /auth/refresh`, retry the original request. Silent refresh in `check()` on page reload.
5. ✅ **Create `/change-password` route** — forced flow for `mustChangePassword` users with strength indicators and client-side validation (12+ chars, uppercase, lowercase, digit, symbol).
6. ✅ **Add logout flow** — best-effort `POST /auth/logout`, clear tokens + stored user, redirect to `/login`.
7. ✅ **Store user identity** (id, email, role, departmentId, mustChangePassword) in Refine's `getIdentity` via `stored-user.ts` for downstream RBAC and scoping.

**Backend dependencies:** None — all auth endpoints exist.

**Branch:** `feature/admin-auth`

---

### Phase B — RBAC & Access Control ✅
**Goal:** Enforce role-based tab visibility and page-level access.

**Priority:** High — must follow immediately after auth.

**Completed:** 2026-03-04

**Todos:**
1. ✅ **Create `accessControlProvider`** for Refine implementing the RBAC matrix:
   - Admin → Queue Control, Analytics, Organization (all sub-tabs), User Experience
   - IT → Organization (all sub-tabs) + User Experience
   - Manager → Queue Control + Analytics only
   - Organization sub-tabs: Metadata, User Management, Departments, Mapping, Transfer Reasons
   - Block access server-side AND client-side
2. ✅ **Filter sidebar items** — use `useCan` to conditionally render sidebar links per role via `useFilteredMenu()` hook.
3. ✅ **Add route guards** — `RequireAccess` component redirects to `/unauthorized` if a user navigates to a forbidden tab.
4. ✅ **Scope Manager data** — `withManagerScope` wrapper auto-injects `departmentId` filter on `getList` for Manager users.
5. ✅ **Create a simple "Unauthorized" page** for forbidden access attempts.

**Backend dependencies:** None — role is returned in the login response, RBAC is enforced server-side on every API call.

**Branch:** `feature/admin-rbac`

---

### Phase C — Queue Control Page ✅
**Goal:** Live queue dashboard with ticket lookup and priority change.

**Priority:** High — core operational tab for Admin + Manager.

**Completed:** 2026-03-05 — Full dashboard with selectors, summary cards, now-serving, waiting list, ticket search, ticket detail panel, and priority change flow. WebSocket deferred to Phase H (using 10 s polling).

**Backend endpoints built (in `server.ts`):**
- `GET /admin/tickets/search?q=...&serviceId=...` — search by ticket number or phone
- `GET /admin/tickets/:ticketId` — full ticket detail with events (audit trail)
- `POST /admin/tickets/:ticketId/lock` — acquire 2-minute lock for priority change
- `POST /admin/tickets/:ticketId/unlock` — release lock
- `POST /admin/tickets/:ticketId/change-priority` — change priority (validates lock + WAITING status)
- `GET /admin/priority-categories` — list priority categories for the hospital

**Todos:**
1. ✅ **Department selector** (Admin: all departments dropdown; Manager: auto-locked to assigned department).
2. ✅ **Service selector** scoped to the selected department (calls `GET /departments/:id/services`).
3. ✅ **Queue status widgets** — display waiting, called, serving, completed, no-show counts (calls `GET /queue/services/:serviceId/summary`). 10-second polling until WebSocket is wired.
4. ✅ **Now-serving indicator** — show the ticket currently being served with status badge and elapsed time.
5. **WebSocket integration** — deferred to Phase H. Currently using 10 s polling.
6. ✅ **Waiting list table** — display the ordered waiting queue (calls `GET /queue/services/:serviceId/waiting`) with columns: position, ticket number, priority badge, wait time. Rows are clickable to open ticket detail.
7. ✅ **Ticket lookup** — search by ticket number or phone number via `GET /admin/tickets/search`. Debounced search input with dropdown results. Clicking a result opens the detail panel.
8. ✅ **Ticket detail panel** — Sheet side-panel showing all ticket fields + full audit trail (events). Includes "Change Priority" button for WAITING tickets.
9. ✅ **Priority change flow:**
   - Lock the ticket (`POST /admin/tickets/:ticketId/lock`) — 2-minute lock with conflict detection.
   - Show priority change UI listing all hospital priority categories.
   - Submit change via `POST /admin/tickets/:ticketId/change-priority`.
   - Lock auto-released after successful change; audit trail recorded server-side.
10. ✅ **Enforce rule:** priority change blocked if ticket status ≠ WAITING (UI disables button + server validates in both lock and change-priority endpoints).

**Branch:** `feature/admin-queue-control`

---

### Phase D — Organization Page
**Goal:** Unified organization management hub — metadata, users, departments, mapping, and transfer reasons.

**Priority:** High — Admin + IT, critical for system setup.

**Navigation:** Organization appears as a collapsible sidebar item with 5 sub-tabs.
All sub-tabs are accessible to Admin and IT roles.

**Route:** `/organization/*` (sub-routes: `/metadata`, `/users`, `/departments`, `/mapping`, `/transfer-reasons`)

#### D.1 — Organization Metadata (`/organization/metadata`)
**Todos:**
1. **Organization info form** — editable fields: logo, name, address, email, website.
2. **Logo upload** — call `POST /users/:id/avatar` pattern (or a dedicated org logo endpoint).
   - *Backend dependency:* organization metadata endpoints — **needs backend work**.
3. **Save/cancel UX** with validation.

#### D.2 — User Management (`/organization/users`)
**Todos:**
1. **Users list table** — DataTable with columns: name, email, role, department, status (active/disabled).
   - *Backend dependency:* `GET /admin/users` — **needs backend work**.
2. **Create user form** — fields: name, email, role selector, department selector (for Manager/Staff), temporary password.
   - Password validation: min 12 chars, 1 uppercase, 1 lowercase, 1 digit, 1 symbol.
   - *Backend dependency:* `POST /admin/users` — **needs backend work**.
3. **Edit user form** — update name, role, department assignment, enable/disable.
   - *Backend dependency:* `PATCH /admin/users/:id` — **needs backend work**.
4. **Password reset** — Admin sets a temporary password + `mustChangePassword` flag.
   - *Backend dependency:* `POST /admin/users/:id/reset-password` — **needs backend work**.
5. **User avatar upload** — optional profile picture.
   - *Backend dependency:* `POST /users/:id/avatar` — **needs backend work**.
6. **Role assignment rules:**
   - Manager: must assign exactly one department.
   - Staff: must assign exactly one department.
   - Admin/IT: no department scope.

#### D.3 — Departments Structure (`/organization/departments`)
**Todos:**
1. **Departments table** — DataTable with columns: name (Arabic), name (English), service count, status.
   - Uses `GET /departments` (public, exists) for listing.
2. **Create department** — form/modal with name (Arabic) + name (English).
   - *Backend dependency:* `POST /admin/departments` — **needs backend work**.
3. **Edit department** — modal editing of department names.
   - *Backend dependency:* `PATCH /admin/departments/:id` — **needs backend work**.
4. **Deactivate department** — soft-delete with confirmation.
   - *Backend dependency:* `DELETE /admin/departments/:id` — **needs backend work**.
5. **Services sub-table** — when a department row is expanded or selected, show a services DataTable below with columns: name (Arabic), name (English), ticket prefix, estimated wait time, status.
   - Uses `GET /departments/:id/services` (exists) for listing.
6. **Create service** — form/modal with: name (Arabic), name (English), ticket prefix, estimated wait time.
   - *Backend dependency:* `POST /admin/departments/:id/services` — **needs backend work**.
7. **Edit service** — modal editing of service fields.
   - *Backend dependency:* `PATCH /admin/services/:id` — **needs backend work**.
8. **Deactivate service** — soft-delete with confirmation.
   - *Backend dependency:* `DELETE /admin/services/:id` — **needs backend work**.
9. **Validation rules:**
   - Ticket prefix must be unique across the hospital.
   - Department/service names in both languages required.

#### D.4 — Mapping (`/organization/mapping`)
**Todos:**
1. **Device registry table** — list all registered devices (kiosks, teller PCs, signage players).
   - *Backend dependency:* `GET /admin/devices` — **needs backend work**.
2. **Enroll device** — register a new device by Device ID + type + label.
   - *Backend dependency:* `POST /admin/devices` — **needs backend work**.
3. **Counter-to-service binding** — bind a counter station to a service + department.
   - Uses `POST /admin/config/mapping` (exists, but may need expansion).
4. **Teller PC binding** — bind a Device ID to a counter station.
   - Uses existing mapping endpoint.
5. **Kiosk configuration** — assign mode (reception/department-locked), department, remote config.
   - *Backend dependency:* kiosk config endpoints — **needs backend work**.
6. **Signage player zoning** — assign a signage device to a department zone.
   - *Backend dependency:* signage config endpoints — **needs backend work**.

#### D.5 — Transfer Reasons (`/organization/transfer-reasons`)
**Todos:**
1. **Transfer reasons list** — DataTable with columns: Arabic name, English name, display order, active status.
   - Uses `GET /admin/transfer-reasons` (exists).
2. **Create reason form** — Arabic name + English name.
   - Uses `POST /admin/transfer-reasons` (exists).
3. **Edit reason** — inline or modal.
   - Uses `PATCH /admin/transfer-reasons/:id` (exists).
4. **Deactivate/reactivate toggle** — soft-delete via `DELETE /admin/transfer-reasons/:id` (exists).
5. **Display order** — editable order field.

**Backend dependencies (new endpoints needed — all sub-tabs combined):**
- `GET /admin/users` — list users
- `POST /admin/users` — create user
- `PATCH /admin/users/:id` — update user
- `POST /admin/users/:id/reset-password` — reset password
- `POST /users/:id/avatar` — upload avatar
- Organization metadata CRUD endpoints
- `POST /admin/departments` — create department
- `PATCH /admin/departments/:id` — update department
- `DELETE /admin/departments/:id` — deactivate department
- `POST /admin/departments/:id/services` — create service
- `PATCH /admin/services/:id` — update service
- `DELETE /admin/services/:id` — deactivate service
- `GET /admin/devices` — list devices
- `POST /admin/devices` — register device
- `PATCH /admin/devices/:id` — update device config
- `DELETE /admin/devices/:id` — remove device
- Kiosk remote config endpoints
- Signage zoning endpoints
- Transfer reasons endpoints — **all available**

**Branch:** `feature/admin-organization`

---

### Phase E — User Experience Page
**Goal:** Manage WhatsApp templates and patient-facing text/content.

**Priority:** Medium — IT + Admin operational config.

#### E.1 — WhatsApp Message Templates
**Todos:**
1. **Template list** — grouped by event type, showing Arabic + English versions.
   - Uses `GET /admin/config/templates` (exists).
2. **Template editor** — per event type, per language, with variable placeholders preview.
   - Uses `POST /admin/config/templates` (upsert, exists).
3. **Event types** — created, called, nearing-turn, completed, transferred, skipped, etc.

#### E.2 — Patient-Facing Text
**Todos:**
1. **Kiosk text management** — configurable labels/instructions shown on kiosk screens (Arabic/English).
   - *Backend dependency:* May need a key-value config endpoint — **needs backend work or reuse templates endpoint**.
2. **Patient PWA text** — similar configurable content.

**Backend dependencies:** Mostly available. Patient-facing text config may need a new endpoint.

**Branch:** `feature/admin-user-experience`

---

### Phase F — Analytics Page
**Goal:** Performance KPIs, trends, and predictive insights.

**Priority:** Medium — Admin + Manager operational intelligence.

#### F.1 — KPI Cards
**Todos:**
1. **Summary cards** — average wait time, average service time, completion rate, currently waiting, tickets issued today, tickets served, in-progress, no-show rate.
   - *Backend dependency:* `GET /analytics/overview` — **needs backend work**.
2. **Department filter** (Admin: all, Manager: locked to own).
3. **Time range filter** (today, 7 days, 30 days, custom).

#### F.2 — Charts & Trends
**Todos:**
1. **Wait time trend chart** — line chart over time (recharts is already installed).
2. **Department performance comparison** — bar chart.
3. **Service distribution** — pie/donut chart.
4. **Ticket volume breakdown** — stacked area chart.
5. **Throughput analysis** — completion rate, tickets/hour, estimated clear time.
   - *Backend dependency:* `GET /analytics/trends`, `GET /analytics/throughput` — **needs backend work**.

#### F.3 — Predictive Insights (Future)
**Todos:**
1. **Wait time estimation widget** — with confidence indicator.
2. **Peak hours prediction** — based on historical patterns.
3. **Volume forecast** — next week projection.
4. **Staffing recommendations** — based on predicted volume.
5. **Key predictive insights** summary.
6. **"No historical data available yet" placeholder** — shown until sufficient data exists.

**Backend dependencies (new endpoints needed):**
- `GET /analytics/overview` — KPI summary
- `GET /analytics/trends` — time-series data
- `GET /analytics/throughput` — throughput metrics
- `GET /analytics/predictions` — predictive insights (later phase)

**Branch:** `feature/admin-analytics`

---

### Phase G — Internationalization (i18n)
**Goal:** Full Arabic + English support throughout the admin app.

**Priority:** Medium — required before production deployment.

**Todos:**
1. **Configure Refine i18n provider** — integrate `react-i18next` or Refine's built-in i18n.
2. **Extract all UI strings** into translation files (en.json, ar.json).
3. **RTL layout support** — Tailwind RTL utilities, `dir="rtl"` on document root when Arabic is active.
4. **Language switcher** in the header — toggle between Arabic and English.
5. **Bilingual data display** — department/service names, transfer reasons, templates shown in both languages where applicable.
6. **Date/time formatting** — locale-aware formatting using `date-fns` locales.

**Backend dependencies:** None.

**Branch:** `feature/admin-i18n`

---

### Phase H — WebSocket Integration & Live Updates
**Goal:** Real-time queue updates across the admin app.

**Priority:** Medium — enhances Queue Control and Analytics.

**Todos:**
1. **Create a Socket.IO client singleton** — connect to `/realtime/socket.io` with JWT auth.
2. **Auto-reconnect logic** — handle disconnects, re-authenticate on token refresh.
3. **Queue Control integration** — subscribe to `queue.updated` for the selected service; auto-refresh summary + waiting list.
4. **Now-serving live indicator** — update in real-time when a ticket is called.
5. **Analytics live counters** — optionally update today's KPIs in real-time.
6. **Connection status indicator** — show connected/disconnected state in the header or footer.

**Backend dependencies:** None — WebSocket gateway is fully available.

**Branch:** `feature/admin-realtime`

---

### Phase I — Polish, Testing & Production Readiness
**Goal:** Final quality pass before deployment.

**Priority:** Final phase.

**Todos:**
1. **Error boundaries** — wrap each page in error boundaries with friendly fallback UI.
2. **Loading states** — skeleton loaders for tables, cards, and forms.
3. **Empty states** — meaningful empty state messages for tables with no data.
4. **Form validation UX** — inline errors, field-level validation with zod schemas.
5. **Responsive design audit** — ensure all pages work on tablet/desktop breakpoints.
6. **Accessibility audit** — keyboard navigation, ARIA labels, focus management.
7. **Performance audit** — lazy-load pages, optimize bundle size.
8. **E2E smoke tests** — critical paths (login → queue control → priority change).
9. **PWA manifest** — configure for installable PWA.
10. **Docker build** — verify Dockerfile produces a working production build.

**Branch:** `feature/admin-polish`

---

## Phase Dependency Graph

```text
Phase A (Auth) ────────────────────────────────┐
    │                                          │
    ▼                                          │
Phase B (RBAC) ───────────────────────────┐    │
    │                                     │    │
    ├──► Phase C (Queue Control)          │    │
    ├──► Phase D (Organization)           │    │
    ├──► Phase E (User Experience)        │    │
    └──► Phase F (Analytics)              │    │
                                          │    │
Phase G (i18n) ◄──── can start anytime ──►│    │
Phase H (Realtime) ◄── after Phase C ────►│    │
                                          │    │
                                          ▼    ▼
                                    Phase I (Polish)
```

**Critical path:** A → B → C (Queue Control is the first user-facing deliverable after auth).

Phases C through F can be developed **in parallel** once B is complete, subject to backend endpoint availability. Recommended sequencing by backend readiness:

| Order | Phase | Status |
|-------|-------|--------|
| 1 | A — Auth | ✅ Complete |
| 2 | B — RBAC | ✅ Complete |
| 3 | C — Queue Control | ✅ Complete — dashboard, search, detail, priority change (WebSocket deferred to Phase H) |
| 4 | D — Organization | Not started (transfer reasons ready; user mgmt, dept CRUD, mapping, org metadata need backend work) |
| 5 | E — User Experience | Not started (needs patient text config endpoint) |
| 6 | F — Analytics | Not started (needs analytics endpoints) |
| 7 | G — i18n | Not started (independent) |
| 8 | H — Realtime | Not started (independent, after C) |
| 9 | I — Polish | Last |

---

## Mock Provider Strategy

For pages where backend endpoints are not yet available, follow the project's **data provider switching pattern**:

1. Create a `mock` data provider that returns contract-shaped responses.
2. Create an `http` data provider that calls the real backend.
3. Switch via `VITE_DATA_PROVIDER=mock|http` environment variable.
4. Mock responses must respect domain rules (RBAC scopes, queue constraints, error codes).

This allows UI development to proceed **without blocking on backend delivery**.

---

## Estimated Effort Summary

| Phase | Estimated Effort | Backend Work Needed |
|-------|-----------------|---------------------|
| A — Auth | 2–3 days | None |
| B — RBAC | 1–2 days | None |
| C — Queue Control | 3–5 days | Ticket lookup + lock endpoints |
| D — Organization (5 sub-tabs) | 8–12 days | User CRUD, org metadata, dept/service CRUD, device registry endpoints |
| E — User Experience | 2–3 days | Minimal (patient text config) |
| F — Analytics | 4–6 days | Analytics endpoints |
| G — i18n | 2–3 days | None |
| H — Realtime | 2–3 days | None |
| I — Polish | 3–5 days | None |
| **Total** | **~27–42 days** | |

---

## File/Folder Structure Plan

```text
src/
├── providers/
│   ├── auth-provider.ts          ← Phase A
│   ├── access-control-provider.ts ← Phase B
│   ├── data.ts                   ← existing (enhance with mock switching)
│   ├── mock-data-provider.ts     ← mock provider for offline dev
│   ├── constants.ts              ← existing
│   ├── i18n-provider.ts          ← Phase G
│   └── realtime-provider.ts      ← Phase H
├── hooks/
│   ├── use-mobile.ts             ← existing
│   ├── use-socket.ts             ← Phase H
│   └── use-current-user.ts       ← Phase A/B
├── pages/
│   ├── login/
│   │   ├── index.tsx             ← Phase A
│   │   └── change-password.tsx   ← Phase A
│   ├── QueueControl.tsx          ← Phase C
│   ├── Analytics.tsx             ← Phase F
│   ├── UserExperience.tsx        ← Phase E
│   ├── Welcome.tsx               ← existing
│   ├── Unauthorized.tsx          ← existing
│   └── organization/
│       ├── OrgMetadata.tsx       ← Phase D.1
│       ├── UserManagement.tsx    ← Phase D.2
│       ├── DepartmentsStructure.tsx ← Phase D.3
│       ├── Mapping.tsx           ← Phase D.4
│       └── TransferReasons.tsx   ← Phase D.5
└── lib/
    ├── utils.ts                  ← existing
    ├── api-client.ts             ← Phase A (axios/fetch wrapper with token refresh)
    └── rbac-rules.ts             ← Phase B (role → allowed resources map)
```
