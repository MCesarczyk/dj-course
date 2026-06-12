---
name: project-tms-architecture
description: Current architectural state of tms-frontend — React/Vite/TanStack Query app with horizontal layer structure being migrated toward VSA
metadata:
  type: project
---

This is a React + Vite + TypeScript frontend (NOT Angular) for a Transport Management System called "Deliveroo Logistics".

**Stack:** React 18, TanStack Query, React Router v6, Tailwind CSS, Leaflet, shadcn/ui components, jsPDF.

**Current layer structure (horizontal):**
- `src/http/` — API fetch functions + mocks, one file per domain (shipments.http.ts, drivers.http.ts, etc.)
- `src/model/` — Domain types and mock data, one subdirectory per entity (shipments/, drivers/, vehicles/, documents/)
- `src/hooks/queries/` — TanStack Query hooks, all co-located in one flat directory
- `src/components/` — Shared UI primitives (LoadingSpinner, ErrorBoundary, ErrorMessage) and shadcn/ui in components/ui/
- `src/components/layout/` — App shell (Header, Sidebar, Layout)
- `src/pages/` — Route entry pages (flat .tsx files) + feature sub-folders (route-planner/, drivers/, vehicles/, orders/, etc.)
- `src/lib/` — Pure utilities: date/dateUtils.ts, pdf/ generators, tailwind/utils.ts, broker/MessageBroker.ts

**Route URLs:** /routes (RoutePlanner), /orders, /drivers, /vehicles, /maintenance, /documents, /payments, etc.

**Key coupling issues:**
- `src/model/shipments/logistics.types.ts` holds RoutePoint, RouteData, Coordinates, Vehicle (map vehicle) — these are tightly coupled to the route-planner feature but shared via the model layer
- There is a naming collision: `Vehicle` in `model/shipments/logistics.types.ts` (map vehicle with coordinates/speed/heading) vs `Vehicle` in `model/vehicles/vehicle.types.ts` (fleet vehicle entity). UnifiedRoutePlanner aliases one as `VehicleType`.
- `src/hooks/queries/` is a monolithic barrel — all query hooks for all features in one index
- The route-planner feature is already partially isolated in `src/pages/route-planner/` — components, utils, and the entry page are together. The main gap is that types (RoutePoint, RouteData, etc.) live in `src/model/shipments/` and query hooks live in `src/hooks/queries/`

**Why:** This was identified during a VSA refactoring exercise for the M7 course module.

**How to apply:** When proposing VSA changes, treat `src/model/shipments/logistics.types.ts` and `src/hooks/queries/useShipmentsList.ts` as candidates to move into the route-planner slice. Flag the Vehicle naming collision as a blocking issue to resolve first.
