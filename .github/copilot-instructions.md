# Copilot Instructions for smart-queue-admin-app

## Scope and stack (locked)
- This repository implements the Admin RBAC web app only.
- Stack is locked to React + Refine Core + Tailwind CSS + shadcn/ui.
- Reuse existing component patterns under `src/components/*` before adding new primitives.

## RBAC UI constraints (must not be violated)
- Sidebar tabs are fixed to:
  1. Queue Control
  2. Analytics
  3. Organization
  4. Departments Structure
  5. User Experience
  6. Mapping
- Role visibility must remain:
  - Admin: all tabs
  - IT: User Experience + Mapping only
  - Manager: Queue Control + Analytics only
- Manager scope is exactly one assigned department.

## Product behavior constraints
- Do not add any UI path that implies manual queue reordering.
- Queue Control may allow priority changes only for tickets not yet called.
- Teller execution actions (Call Next / Recall / Skip / Transfer / Complete) do not belong in Admin app workflows.

## UI/UX implementation guidance
- Preserve the current design system and spacing/typography conventions from existing components.
- Do not hardcode new design tokens when existing Tailwind/shadcn patterns cover the requirement.
- Keep Arabic/English field support in forms where configured entities are bilingual.
- Prefer minimal, clear interfaces over speculative feature expansion.

## API and security expectations
- UI role-based hiding is not a security boundary; assume server-side RBAC is authoritative.
- Keep client-side access checks aligned with backend role/scope contracts.
- For sensitive edits (priority changes, mappings, user management), keep audit-aware UX (clear actor/action context).

## Workflow expectations
- Use feature branches (`feature/<area>-<name>`) and PR-based merges to `main`.
- Keep changes surgical and requirement-aligned.
- Update relevant docs when behavior or scope changes:
  - `../docs/admin-app-spec.md`
  - `../docs/implementation-phases.md`
- If uncertain, follow the simplest behavior that matches product docs.
