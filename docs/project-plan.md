# Implementation Plan

This document breaks the project into six executable phases. Each phase
lists objectives, workstreams, deliverables, dependencies, and exit
criteria so you can quickly confirm readiness before progressing.

---

## Phase 1 – Data & API Foundation ✅ COMPLETED

**Status:** Complete  
**Stack:** NestJS 11 + Prisma 7 + PostgreSQL

**Objectives**
- Translate pseudo models into concrete database schema, migrations, and
  validation logic.
- Stand up service contracts (REST/GraphQL) that expose CRUD +
  transition endpoints for Suites, Tasks, Employees, Notes, and
  Notifications.

**Completed Workstreams**
1. ✅ NestJS project initialized with TypeScript strict mode
2. ✅ Prisma schema with all entities, enums, relationships, and indexes
3. ✅ DTOs with class-validator matching validation rules
4. ✅ CRUD controllers/services for all entities with status transitions
5. ✅ Seed script with sample data for all entities
6. ✅ JWT authentication with Passport
7. ✅ Swagger/OpenAPI documentation

**Deliverables**
- ✅ `backend/prisma/schema.prisma` - Complete database schema
- ✅ `backend/src/` - Service layer with validation + error handling
- ✅ Swagger docs at `/api/docs` when running
- ✅ `backend/prisma/seed.ts` - Seed data script

**Implementation Details**
- Authentication: JWT with argon2 password hashing
- Modules: Auth, Suites, Tasks, Employees, Notes, Notifications
- All DTOs use class-validator decorators
- Swagger annotations on all endpoints

**Next Steps (Phase 2)**
- Implement status transition guards and business rule enforcement
- Add notification queue worker with BullMQ
- Implement RBAC permission guards

---

## Phase 2 – Workflow & Business Logic Services ✅ COMPLETED

**Status:** Complete

**Objectives**
- Codify suite/task status transitions, maintenance history capture, and
  notification fan-out as reusable domain services.
- Enforce permission matrix for every action.

**Completed Workstreams**
1. ✅ `SuiteStatusService` - Validates all suite status transitions with rules
2. ✅ `TaskStatusService` - Validates task status transitions with context checks
3. ✅ Domain events system using `@nestjs/event-emitter`
4. ✅ Event listeners for task completion, suite changes, emergencies
5. ✅ Bull queue for async notification processing
6. ✅ RBAC guards with permission decorators
7. ✅ 45 unit tests for status services (all passing)

**Deliverables**
- ✅ `backend/src/domain/status/` - Status transition services
- ✅ `backend/src/domain/events/` - Domain event definitions
- ✅ `backend/src/domain/listeners/` - Event handlers
- ✅ `backend/src/domain/queue/` - Bull notification processor
- ✅ `backend/src/domain/rbac/` - Permission guards and decorators

**Implementation Details**
- Suite transitions enforce cleaning/maintenance task requirements
- Task transitions validate required fields (assignedTo, timestamps)
- Emergency tasks auto-notify all supervisors/managers
- Task completion auto-updates suite status via event listeners
- RBAC supports wildcard (*) for admin/manager roles

**Next Steps (Phase 3)**
- Set up React/Next.js frontend with state management
- Implement normalized entity stores matching pseudo-code
- Build API client with optimistic updates

---

## Phase 3 – Client State Store Implementation ✅ COMPLETED

**Status:** Complete
**Stack:** Next.js 16 + Zustand 5 + React Query 5 + TypeScript

**Objectives**
- Implement the global store that mirrors `GLOBAL_STATE` plus actions,
  selectors, and middleware described in
  `docs/pseudo-code/02-state-management.md`.

**Completed Workstreams**
1. ✅ Zustand stores with normalized entity adapters (items/allIds pattern)
2. ✅ Async actions with optimistic updates and error rollback
3. ✅ Comprehensive selectors for dashboards, filters, grouped views
4. ✅ Middleware: dev logging, localStorage persistence, offline queue, permissions
5. ✅ API client with axios, token refresh, and error handling

**Deliverables**
- ✅ `frontend/src/lib/types/` - TypeScript types matching backend entities
- ✅ `frontend/src/lib/api/` - API client with token management
- ✅ `frontend/src/lib/store/` - 9 Zustand stores (auth, suites, tasks, employees, notes, notifications, UI, sync, cache)
- ✅ `frontend/src/lib/store/selectors/` - Dashboard, suite, task, employee selectors
- ✅ `frontend/src/lib/store/middleware/` - Logging, persistence, permissions
- ✅ `frontend/src/lib/providers/` - React Query and Store providers
- ✅ 39 unit tests passing (`npm run test:state`)

**Implementation Details**
- Zustand 5 with immer middleware for immutable updates
- Normalized state with items map + allIds array pattern
- Task groupings: bySuite, byEmployee, byStatus, byPriority
- Employee groupings: onDuty, available, byDepartment, byRole
- Offline support with pending changes queue and auto-sync
- Permission middleware with role-based action checks

**Next Steps (Phase 4)**
- Build UI components consuming the state stores
- Implement navigation shell with sidebar
- Create feature pages: Dashboard, Suites, Tasks, Employees, Notes

---

## Phase 4 – UI Modules ✅ COMPLETED

**Status:** Complete
**Stack:** Next.js 16 App Router + Tailwind CSS 4 + Custom Design System

**Objectives**
- Build the user-facing views (dashboard, suites board, tasks list/kanban
  /calendar, employee roster, notes center, notification tray, settings).
- Ensure responsiveness and accessibility for desktop + tablet.

**Completed Workstreams**
1. ✅ Design system with CSS custom properties (colors, typography, spacing, shadows)
2. ✅ Base UI components: Button, Card, Badge, Avatar, Input, Select, Modal, Toast
3. ✅ Navigation shell: Sidebar with nav items, Header with search/notifications
4. ✅ Dashboard page with KPI stat cards and donut chart
5. ✅ Suites page with grid view, status filters, and quick status toggles
6. ✅ Tasks page with list and kanban views, drag-and-drop support
7. ✅ Employees page with roster grid and role/status filters
8. ✅ Notes page with timeline view and pinned notes section
9. ✅ CRUD modals: CreateTask, CreateSuite, CreateEmployee, CreateNote

**Deliverables**
- ✅ `frontend/src/app/globals.css` - Design system with CSS variables
- ✅ `frontend/src/components/ui/` - 12 reusable UI components
- ✅ `frontend/src/components/layout/` - MainLayout, Sidebar, Header
- ✅ `frontend/src/components/dashboard/` - StatCard, SuiteStatusChart, ActivityFeed
- ✅ `frontend/src/components/suites/` - SuiteCard, SuiteGrid, SuiteFilters
- ✅ `frontend/src/components/tasks/` - TaskCard, TaskList, TaskKanban, TaskFilters
- ✅ `frontend/src/components/employees/` - EmployeeCard, EmployeeGrid
- ✅ `frontend/src/components/modals/` - 4 CRUD modals
- ✅ `frontend/src/app/` - 5 page routes (dashboard, suites, tasks, employees, notes)

**Implementation Details**
- Tailwind CSS 4 with custom theme extending CSS variables
- DM Sans font for typography, distinctive teal/amber color scheme
- Responsive design: mobile-first with sidebar overlay on tablet/mobile
- Donut chart for suite status visualization
- Kanban board with drag-and-drop for task management
- Status badges with color-coded indicators
- Toast notifications for user feedback

**Next Steps (Phase 5)**
- Implement WebSocket gateway for real-time updates
- Build offline queue manager for field staff tablets
- Add connectivity indicators and sync status

---

## Phase 5 – Real-time & Offline Experience

**Objectives**
- Deliver live updates through WebSockets and support offline-first
  behavior for field staff tablets.

**Key Workstreams**
1. Stand up WebSocket gateway (Socket.IO, WS, or Pusher/Supabase) with
   auth + permissions.
2. Implement handlers outlined in pseudo doc (`suite_updated`,
   `task_assigned`, etc.) and wire to store actions.
3. Build sync queue manager that records pending mutations, retries on
   reconnect, and exposes UX messaging.
4. Add connectivity indicators + toast messaging for offline mode.
5. Load-test real-time flows (many simultaneous updates).

**Deliverables**
- WebSocket server/client code with reconnection logic.
- Offline queue tests (unit + simulated browser tests).
- Monitoring dashboards for connection health.

**Dependencies / Decisions**
- Choice of real-time infra (self-hosted vs. managed).
- Conflict resolution policy when offline edits collide.

**Exit Criteria**
- Manual QA verifying live updates across two browsers.
- Offline scenario test plan executed (airplane mode, reconnection).

---

## Phase 6 – Observability, QA, and Launch Readiness

**Objectives**
- Harden the system with monitoring, analytics, automated testing, and
  deployment runbooks.

**Key Workstreams**
1. Integrate logging/monitoring (OpenTelemetry, Datadog) across API,
   jobs, and client.
2. Build CI/CD pipelines with quality gates (lint, tests, build, e2e).
3. Author comprehensive test suites: API contract tests, component
   tests, cypress/playwright flows, load tests.
4. Prepare ops docs: runbooks, incident response, backup strategy,
   rollout plan, feature toggles.
5. Conduct security review (auth flows, stored credentials, PII handling).

**Deliverables**
- CI/CD configuration + dashboards showing build health.
- Monitoring + alerting rules for key SLIs (API latency, job failures,
   websocket disconnect rate).
- Launch checklist covering smoke tests, rollback strategy, access
   controls.

**Dependencies / Decisions**
- Hosting provider + deployment targets (Docker, Kubernetes, serverless).
- Alerting channels (PagerDuty, Slack).

**Exit Criteria**
- All automated tests green with targeted coverage goals met.
- Observability panels and alerts verified.
- Launch readiness review signed off by stakeholders.

