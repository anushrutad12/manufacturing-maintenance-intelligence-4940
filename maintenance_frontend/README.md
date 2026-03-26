# Predictive Maintenance Frontend (React)

Production-ready React UI for a Predictive Maintenance Alert & Work Order System.

## Features

- Side navigation app shell (Ocean Professional theme)
- Pages:
  - Dashboard
  - Equipment Register
  - Parameter Logging (auto-alert creation on threshold breach)
  - Alerts Center (convert alert → work order)
  - Work Order Board (status updates, reserve parts, closure + audit trail)
  - Parts Inventory
- Service layer with **automatic mock fallback** for preview readiness
- React Query for server-state, loading/error handling, and cache invalidation

## Run locally

From `maintenance_frontend/`:

```bash
npm install
npm start
```

App runs at `http://localhost:3000`.

## Backend integration

Set env variables (do **not** commit `.env`):

- `REACT_APP_API_BASE_URL`: your FastAPI base URL (no trailing slash), e.g. `http://localhost:3001`
- `REACT_APP_USE_MOCKS`: `true` to force mock mode

See `.env.example`.

### Mock fallback behavior

If `REACT_APP_USE_MOCKS=false` (default) the app will try the backend first. If endpoints are missing/unavailable, it falls back to in-memory mock services so the UI remains fully functional for preview.

## Folder structure

- `src/pages/*` page-level views
- `src/components/*` reusable UI
- `src/layouts/*` app shell layout
- `src/services/*` API + mock-backed domain services
- `src/utils/*` business logic (threshold evaluation, scoring, formatting)
- `src/state/*` React Query client setup
