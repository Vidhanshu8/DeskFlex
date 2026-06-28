# DeskFlex — Frontend (React)

React 18 + TypeScript + Vite + Tailwind CSS. See the [root README](../README.md) for
the full overview.

## Quickstart
```bash
npm install
cp .env.example .env.local    # optional: override VITE_API_BASE_URL
npm run dev                   # http://localhost:5173
```

The frontend expects the Rails API to be running at `http://localhost:3001/api/v1`.

## Layout
```
src/
  api/         axios client + typed endpoint modules
  context/     AuthContext (token + session)
  components/  DateController, Filters, OfficeFloorPlan, Navbar, Toast
  pages/       LoginPage, DashboardPage
  types/       shared API types
```
