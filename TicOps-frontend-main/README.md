# IssueFlow Frontend

A complete React + TypeScript frontend starter for the **IssueFlow Smart Ticketing System**.

## Tech Stack
- React + TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios
- Recharts
- Lucide Icons

## Features Included
- Login flow
- Dashboard with KPIs and charts
- Ticket list with filters
- Ticket creation page
- Ticket detail page with timeline and comments
- Settings screen
- Protected routes
- Mock API mode for instant demo
- Real API service wrappers for backend integration

## Quick Start
```bash
npm install
cp .env.example .env
npm run dev
```

## Mock Mode
By default, `.env.example` enables mock mode:
```env
VITE_USE_MOCKS=true
```
This allows the UI to run without a backend.

## Backend Integration
When your Spring Boot APIs are ready, update:
```env
VITE_USE_MOCKS=false
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

### Expected Backend Endpoints
- `POST /auth/login`
- `GET /dashboard/summary`
- `GET /dashboard/metrics`
- `GET /tickets`
- `GET /tickets/:id`
- `POST /tickets`
- `PATCH /tickets/:id/status`
- `PATCH /tickets/:id/assign`
- `POST /tickets/:id/comments`
- `GET /categories`
- `GET /users`

## Suggested Implementation Notes
- Replace mock services inside `src/services/*` with real backend calls.
- Keep DTOs in sync with Spring Boot request/response payloads.
- Extend `src/types` first whenever new backend fields are added.
