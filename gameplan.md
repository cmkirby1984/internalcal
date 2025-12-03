# InternalCal Project Game Plan

## 1. Executive Summary
**Project Status:** UI Prototype Phase
- **Backend:** ✅ Core logic complete (Auth, RBAC, CRUD, Status Flows). Ready for deployment.
- **Frontend:** ⚠️ **Partial.** Page layouts (`Suites`, `Tasks`, `Dashboard`) are built but currently use **hardcoded mock data**.
- **Infrastructure:** ❌ Local-only.

**Immediate Goal:** **Data Integration.** Replace the mock data in the frontend pages with the actual Zustand store selectors to enable real interaction with the backend API.

---

## 2. Implementation Game Plan

### Phase 4: UI Implementation & Integration (Current Focus)

**Status:** 🏗️ In Progress (Layouts created, Data pending)

**Completed:**
*   ✅ Dashboard Layout (`/page.tsx`)
*   ✅ Suites Page Layout (`/suites/page.tsx`)
*   ✅ Tasks Page Layout (`/tasks/page.tsx`)
*   ✅ Component structure (`/components/suites`, `/components/tasks`)

**Remaining Tasks (The "Integration" Step):**
1.  **Remove Mock Data:**
    *   In `src/app/suites/page.tsx`: Replace `mockSuites` with `useSuitesStore(state => state.suites)`.
    *   In `src/app/tasks/page.tsx`: Replace `mockTasks` with `useTasksStore(state => state.tasks)`.
    *   Ensure `useEffect` hooks are added to fetch data on mount (`fetchSuites()`, `fetchTasks()`).
2.  **Implement Modals:**
    *   Connect the "Add Suite" and "New Task" buttons to the actual Modal components (which need to be verified/built in `components/modals`).
    *   Implement the Form logic using `react-hook-form` + Zod (matching backend DTOs).
3.  **Status Updates:**
    *   Wire up the "Status" dropdowns in the UI to call `updateSuiteStatus` and `updateTaskStatus` actions from the store.

### Phase 5: Real-Time Synchronization

**Status:** ⏳ Pending

**Objectives:**
*   Replace "pull to refresh" with live updates.
*   **Backend:** Implement `Socket.io` Gateway.
*   **Frontend:** Create `useSocket` hook to dispatch store actions on events.

---

## 3. Hosting & Deployment Strategy

### Recommended Stack: "The Modern Vercel/Railway Combo"

| Component | Service | Reason |
| :--- | :--- | :--- |
| **Frontend** | **Vercel** | Native Next.js optimization, instant preview deployments. |
| **Backend** | **Railway** | Easiest way to deploy NestJS. Handles build commands automatically. |
| **Database** | **Railway (Postgres)** | One-click provisioning within the same private network as the backend. |
| **Redis** | **Railway (Redis)** | Required for BullMQ (Notifications) and caching. |

---

## 4. Setup & Launch Guide

### A. Local Development (Immediate Action)

1.  **Database Setup (Docker Recommended):**
    Create a `docker-compose.yml` in the root to spin up Postgres & Redis.
    ```yaml
    version: '3.8'
    services:
      postgres:
        image: postgres:15
        ports: ['5432:5432']
        environment:
          POSTGRES_PASSWORD: password
          POSTGRES_DB: internalcal
      redis:
        image: redis:alpine
        ports: ['6379:6379']
    ```

2.  **Environment Variables (`.env`):**

    **Backend (`backend/.env`):**
    ```ini
    DATABASE_URL="postgresql://postgres:password@localhost:5432/internalcal?schema=public"
    JWT_SECRET="super_secure_secret_change_me"
    REDIS_HOST="localhost"
    REDIS_PORT=6379
    PORT=3000
    CORS_ORIGIN="http://localhost:3001"
    ```

    **Frontend (`frontend/.env.local`):**
    ```ini
    NEXT_PUBLIC_API_URL="http://localhost:3000/api"
    ```

### B. Deployment Steps

1.  **Railway (Backend + DB + Redis):**
    *   Create new project -> Add PostgreSQL -> Add Redis.
    *   Connect GitHub repo (Backend folder).
    *   Set variables: `DATABASE_URL`, `REDIS_HOST` (use Railway internal variables).

2.  **Vercel (Frontend):**
    *   Import GitHub repo (Frontend folder).
    *   Set `NEXT_PUBLIC_API_URL`.

---

## 5. "Ultrathink" Insights
*   **Data Flow:** currently, your pages are "dumb" (visual only). The immediate friction point will be **Forms**. Creating a reusable `Form` wrapper that handles validation errors from the backend (NestJS `class-validator`) will save hours of time.
*   **Authentication:** Ensure the `useEffect` that fetches data checks for `isAuthenticated` first, or handles 401 errors by redirecting to `/login` (which needs to be built!).