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
| Routing & resource declaration (6 tabs) | Done |
| Sidebar + header + breadcrumb layout | Done |
| Theme system (light/dark/system) | Done |
| Notification system (Sonner) | Done |
| 46 shadcn/ui primitives | Done |
| Refine CRUD primitives (DataTable, buttons, views) | Done |
| REST data provider (`@refinedev/rest`) | Configured, unused |
| Auth forms (login, change-password) | ✅ Implemented (Phase A) |
| **Auth provider (Refine `authProvider`)** | ✅ Implemented (Phase A) |
| **Access control provider (RBAC)** | ✅ Implemented (Phase B) |
| **WebSocket / realtime integration** | **Not implemented** |
| **i18n (Arabic/English)** | **Not configured** |
| **All 6 page bodies** | **Empty stubs** |

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
| **Ticket detail lookup by ID** | **Not yet built** |
| **Ticket lock/unlock (admin priority change)** | **Not yet built** |

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
   - Admin → all 6 tabs
   - IT → User Experience + Mapping only
   - Manager → Queue Control + Analytics only
   - Block access server-side AND client-side
2. ✅ **Filter sidebar items** — use `useCan` to conditionally render sidebar links per role via `useFilteredMenu()` hook.
3. ✅ **Add route guards** — `RequireAccess` component redirects to `/unauthorized` if a user navigates to a forbidden tab.
4. ✅ **Scope Manager data** — `withManagerScope` wrapper auto-injects `departmentId` filter on `getList` for Manager users.
5. ✅ **Create a simple "Unauthorized" page** for forbidden access attempts.

**Backend dependencies:** None — role is returned in the login response, RBAC is enforced server-side on every API call.

**Branch:** `feature/admin-rbac`

---

### Phase C — Queue Control Page
**Goal:** Live queue dashboard with ticket lookup and priority change.

**Priority:** High — core operational tab for Admin + Manager.

**Todos:**
1. **Department selector** (Admin: all departments dropdown; Manager: auto-locked to assigned department).
2. **Service selector** scoped to the selected department (calls `GET /departments/:id/services`).
3. **Queue status widgets** — display waiting, in-progress, serving, completed, no-show counts (calls `GET /queue/services/:serviceId/summary`).
4. **Now-serving indicator** — show the ticket currently being served at each counter.
5. **WebSocket integration** — subscribe to `queue.updated` events for the selected service; auto-refresh summary on change.
6. **Waiting list table** — display the ordered waiting queue (calls `GET /queue/services/:serviceId/waiting`) with columns: position, ticket number, phone, priority, wait time.
7. **Ticket lookup** — search by ticket number or phone number.
   - *Backend dependency:* `GET /tickets/:ticketId` or a search endpoint — **needs backend work or client-side filter on waiting list**.
8. **Ticket detail panel** — read-only fields + audit trail preview.
   - *Backend dependency:* ticket detail endpoint — **needs backend work**.
9. **Priority change flow:**
   - Lock the ticket (`POST /queue/tickets/:ticketId/lock`) — **needs backend work**.
   - Show priority change UI (Normal / VIP / Emergency).
   - Submit change — can reuse `POST /teller/change-priority` for now.
   - Audit trail recorded server-side.
10. **Enforce rule:** priority change blocked if ticket status ≠ WAITING (UI + server).

**Backend dependencies (new endpoints needed):**
- `GET /tickets/:ticketId` — ticket detail lookup
- `GET /tickets?phone=...` — ticket search by phone
- `POST /queue/tickets/:ticketId/lock` — ticket locking
- `POST /queue/tickets/:ticketId/unlock` — ticket unlock

**Branch:** `feature/admin-queue-control`

---

### Phase D — Organization Page
**Goal:** Organization metadata editing and user management CRUD.

**Priority:** High — Admin-only, but critical for system setup.

#### D.1 — Organization Metadata
**Todos:**
1. **Organization info form** — editable fields: logo, name, address, email, website.
2. **Logo upload** — call `POST /users/:id/avatar` pattern (or a dedicated org logo endpoint).
   - *Backend dependency:* organization metadata endpoints — **needs backend work**.
3. **Save/cancel UX** with validation.

#### D.2 — User Management
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

#### D.3 — Transfer Reasons Management
**Todos:**
1. **Transfer reasons list** — DataTable with columns: Arabic name, English name, display order, active status.
   - Uses `GET /admin/transfer-reasons` (exists).
2. **Create reason form** — Arabic name + English name.
   - Uses `POST /admin/transfer-reasons` (exists).
3. **Edit reason** — inline or modal.
   - Uses `PATCH /admin/transfer-reasons/:id` (exists).
4. **Deactivate/reactivate toggle** — soft-delete via `DELETE /admin/transfer-reasons/:id` (exists).
5. **Display order** — editable order field.

**Backend dependencies (new endpoints needed):**
- `GET /admin/users` — list users
- `POST /admin/users` — create user
- `PATCH /admin/users/:id` — update user
- `POST /admin/users/:id/reset-password` — reset password
- `POST /users/:id/avatar` — upload avatar
- Organization metadata CRUD endpoints
- Transfer reasons endpoints — **all available**

**Branch:** `feature/admin-organization`

---

### Phase E — Departments Structure Page
**Goal:** Node-based tree view for department/service configuration.

**Priority:** High — Admin-only, required for initial system setup.

**Todos:**
1. **Tree view component** — visual tree layout showing departments as parent nodes and services as child nodes.
2. **Create department** — form with name (Arabic) + name (English).
   - *Backend dependency:* `POST /admin/departments` — **needs backend work**.
3. **Edit department** — inline or modal editing of department names.
   - *Backend dependency:* `PATCH /admin/departments/:id` — **needs backend work**.
4. **Create service** under a department — form with: name (Arabic), name (English), ticket prefix, estimated wait time.
   - *Backend dependency:* `POST /admin/departments/:id/services` — **needs backend work**.
5. **Edit service** — update service fields.
   - *Backend dependency:* `PATCH /admin/services/:id` — **needs backend work**.
6. **Visual hierarchy** — collapsible tree nodes, drag-less (no manual reordering per spec).
7. **Validation rules:**
   - Ticket prefix must be unique across the hospital.
   - Department/service names in both languages required.

**Backend dependencies (new endpoints needed):**
- `POST /admin/departments` — create department
- `PATCH /admin/departments/:id` — update department
- `DELETE /admin/departments/:id` — deactivate department
- `POST /admin/departments/:id/services` — create service
- `PATCH /admin/services/:id` — update service
- `DELETE /admin/services/:id` — deactivate service

**Branch:** `feature/admin-dept-structure`

---

### Phase F — User Experience Page
**Goal:** Manage WhatsApp templates and patient-facing text/content.

**Priority:** Medium — IT + Admin operational config.

#### F.1 — WhatsApp Message Templates
**Todos:**
1. **Template list** — grouped by event type, showing Arabic + English versions.
   - Uses `GET /admin/config/templates` (exists).
2. **Template editor** — per event type, per language, with variable placeholders preview.
   - Uses `POST /admin/config/templates` (upsert, exists).
3. **Event types** — created, called, nearing-turn, completed, transferred, skipped, etc.

#### F.2 — Patient-Facing Text
**Todos:**
1. **Kiosk text management** — configurable labels/instructions shown on kiosk screens (Arabic/English).
   - *Backend dependency:* May need a key-value config endpoint — **needs backend work or reuse templates endpoint**.
2. **Patient PWA text** — similar configurable content.

**Backend dependencies:** Mostly available. Patient-facing text config may need a new endpoint.

**Branch:** `feature/admin-user-experience`

---

### Phase G — Mapping Page
**Goal:** Device enrollment, counter bindings, and signage zoning.

**Priority:** Medium — IT + Admin hardware configuration.

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

**Backend dependencies (new endpoints needed):**
- `GET /admin/devices` — list devices
- `POST /admin/devices` — register device
- `PATCH /admin/devices/:id` — update device config
- `DELETE /admin/devices/:id` — remove device
- Kiosk remote config endpoints
- Signage zoning endpoints

**Branch:** `feature/admin-mapping`

---

### Phase H — Analytics Page
**Goal:** Performance KPIs, trends, and predictive insights.

**Priority:** Medium — Admin + Manager operational intelligence.

#### H.1 — KPI Cards
**Todos:**
1. **Summary cards** — average wait time, average service time, completion rate, currently waiting, tickets issued today, tickets served, in-progress, no-show rate.
   - *Backend dependency:* `GET /analytics/overview` — **needs backend work**.
2. **Department filter** (Admin: all, Manager: locked to own).
3. **Time range filter** (today, 7 days, 30 days, custom).

#### H.2 — Charts & Trends
**Todos:**
1. **Wait time trend chart** — line chart over time (recharts is already installed).
2. **Department performance comparison** — bar chart.
3. **Service distribution** — pie/donut chart.
4. **Ticket volume breakdown** — stacked area chart.
5. **Throughput analysis** — completion rate, tickets/hour, estimated clear time.
   - *Backend dependency:* `GET /analytics/trends`, `GET /analytics/throughput` — **needs backend work**.

#### H.3 — Predictive Insights (Future)
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

### Phase I — Internationalization (i18n)
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

### Phase J — WebSocket Integration & Live Updates
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

### Phase K — Polish, Testing & Production Readiness
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
Phase A (Auth) ──────────────────────────────┐
    │                                         │
    ▼                                         │
Phase B (RBAC) ──────────────────────────┐    │
    │                                     │    │
    ├──► Phase C (Queue Control)          │    │
    ├──► Phase D (Organization)           │    │
    ├──► Phase E (Dept Structure)         │    │
    ├──► Phase F (User Experience)        │    │
    ├──► Phase G (Mapping)                │    │
    └──► Phase H (Analytics)              │    │
                                          │    │
Phase I (i18n) ◄──── can start anytime ──►│    │
Phase J (Realtime) ◄── after Phase C ────►│    │
                                          │    │
                                          ▼    ▼
                                    Phase K (Polish)
```

**Critical path:** A → B → C (Queue Control is the first user-facing deliverable after auth).

Phases C through H can be developed **in parallel** once B is complete, subject to backend endpoint availability. Recommended sequencing by backend readiness:

| Order | Phase | Backend Ready? |
|-------|-------|----------------|
| 1 | A — Auth | Yes |
| 2 | B — RBAC | Yes |
| 3 | C — Queue Control | Partially (need ticket lookup + lock) |
| 4 | D — Organization | Partially (transfer reasons ready; user mgmt + org metadata need backend work) |
| 5 | E — Dept Structure | Needs CRUD endpoints |
| 6 | F — User Experience | Needs patient text config endpoint |
| 7 | G — Mapping | Needs device registry endpoints |
| 8 | H — Analytics | Needs analytics endpoints |
| 9 | I — i18n | Independent |
| 10 | J — Realtime | Independent (after C) |
| 11 | K — Polish | Last |

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
| D — Organization | 4–6 days | User CRUD + org metadata endpoints |
| E — Dept Structure | 3–4 days | Dept/service CRUD endpoints |
| F — User Experience | 2–3 days | Minimal (patient text config) |
| G — Mapping | 3–4 days | Device registry endpoints |
| H — Analytics | 4–6 days | Analytics endpoints |
| I — i18n | 2–3 days | None |
| J — Realtime | 2–3 days | None |
| K — Polish | 3–5 days | None |
| **Total** | **~29–44 days** | |

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
│   ├── i18n-provider.ts          ← Phase I
│   └── realtime-provider.ts      ← Phase J
├── hooks/
│   ├── use-mobile.ts             ← existing
│   ├── use-socket.ts             ← Phase J
│   └── use-current-user.ts       ← Phase A/B
├── pages/
│   ├── login/
│   │   ├── index.tsx             ← Phase A
│   │   └── change-password.tsx   ← Phase A
│   ├── queue-control/
│   │   ├── index.tsx             ← Phase C
│   │   ├── queue-status.tsx
│   │   ├── waiting-list.tsx
│   │   ├── ticket-detail.tsx
│   │   └── priority-change.tsx
│   ├── analytics/
│   │   ├── index.tsx             ← Phase H
│   │   ├── kpi-cards.tsx
│   │   ├── charts/
│   │   └── predictive/
│   ├── departments-structure/
│   │   ├── index.tsx             ← Phase E
│   │   └── tree-view.tsx
│   ├── organization/
│   │   ├── index.tsx             ← Phase D
│   │   ├── org-metadata.tsx
│   │   ├── transfer-reasons.tsx
│   │   └── user-management/
│   │       ├── user-list.tsx
│   │       ├── user-form.tsx
│   │       └── password-reset.tsx
│   ├── user-experience/
│   │   ├── index.tsx             ← Phase F
│   │   ├── whatsapp-templates.tsx
│   │   └── patient-text.tsx
│   └── mapping/
│       ├── index.tsx             ← Phase G
│       ├── device-registry.tsx
│       ├── counter-binding.tsx
│       ├── kiosk-config.tsx
│       └── signage-zoning.tsx
└── lib/
    ├── utils.ts                  ← existing
    ├── api-client.ts             ← Phase A (axios/fetch wrapper with token refresh)
    └── rbac-rules.ts             ← Phase B (role → allowed resources map)
```
