# DeskFlex — Hot-Desk Booking Dashboard

A lightweight hybrid-work desk planner. Employees pick a calendar date, see which
desks are open or occupied across office zones on a **live floor plan**, and reserve
an available desk for that day. The system enforces two booking rules at the database
level: **no two people can hold the same desk on the same date**, and **each user can
hold at most one desk per day**.

```
deskflex/
├── backend/            # Ruby on Rails 7.1 (API-only) + PostgreSQL
├── frontend/           # React 18 + TypeScript + Vite + Tailwind + Framer Motion
└── docker-compose.yml  # runs the full real stack with one command
```

---

## ▶ Run it (one command, recommended)

The only prerequisite is **Docker Desktop** (or Docker Engine + Compose). From the
unzipped folder:

```bash
docker compose up --build
```

That brings up three services together — PostgreSQL, the Rails API, and the React
app — and **automatically creates the database, runs migrations, and seeds demo
data** on first boot. When the logs settle, open:

```
http://localhost:5173      →  click "Use demo login"
```

| Service   | URL                              |
|-----------|----------------------------------|
| Frontend  | http://localhost:5173            |
| API       | http://localhost:3001/api/v1     |
| Postgres  | localhost:5432                   |

Stop with `Ctrl+C`; remove everything (including the DB volume) with
`docker compose down -v`.

> **Why Docker?** A full-stack app needs a running PostgreSQL server plus Ruby and
> Node dependencies, so it can't literally run on double-click. Docker is the
> closest honest equivalent: one command, no local Ruby/Node/Postgres install
> required. The manual setup below is for working on the code directly.

---

## ▶ Run the frontend only (with the Rails API)

To see and work on the UI without Docker, start the Rails API in one terminal and the
frontend in another. The frontend talks to the Rails backend at
`http://localhost:3001/api/v1`.

```bash
# terminal 1 — Rails API on :3001
cd backend
bundle install
bin/rails db:create db:migrate db:seed   # or: bin/setup
bin/rails server

# terminal 2 — frontend on :5173
cd frontend && npm install && npm run dev
```

Open **http://localhost:5173** and click **"Use demo login"**.

Nothing else in the frontend changes — the same endpoints, request/response shapes,
and status codes are used throughout.

---

## Tech choices & rationale

| Layer    | Choice                              | Why |
|----------|-------------------------------------|-----|
| Backend  | **Ruby on Rails 7.1 (API-only)**    | The brief allowed Python *or* Rails. Rails was chosen because its convention-driven structure (service objects, concerns, Active Record) makes the required *separation of concerns* explicit, and `has_secure_password` + DB unique indexes give auth and the booking guarantees with minimal ceremony. |
| Database | **PostgreSQL**                      | Required. Also the natural fit for the **composite unique indexes** that enforce the core rules at the storage layer — the only place a race condition can be closed reliably. |
| Frontend | **React + TypeScript + Vite + Tailwind + Framer Motion** | TypeScript (the brief's preference) gives an end-to-end typed API contract. Vite for fast dev/HMR. Tailwind for a hand-built UI; Framer Motion for the floor-plan and interaction animations. |
| Auth     | **JWT (stateless)**                 | No server-side session store; the SPA stores a bearer token and sends it on every request. |

### A note on the schema ("two tables")

The brief says *"You only need two tables."* The core relational domain **is** two
tables — **`desks`** and **`bookings`** — where the relationship and the uniqueness
guarantees live. A third table, **`users`**, was added solely to satisfy the
explicitly-required **Authentication APIs**; without persisted users there is nothing
to authenticate. It is intentionally minimal (name, email, password digest).

---

## Business rules & where they're enforced

| Rule | Frontend (UX) | Backend (authoritative) |
|------|---------------|--------------------------------|
| No two people book the same desk on the same date | shows desk as occupied; 409 toast on a lost race | **DB unique index** `(desk_id, booking_date)` + model validation → **409** |
| A user holds at most one desk per day | blocks the action with a toast + a "you're booked today" banner | **DB unique index** `(user_id, booking_date)` + model validation + service pre-check → **409** |
| Bookings are weekdays only (no Sat/Sun) | date defaults to a weekday, arrows skip weekends, calendar picks snap forward with a notice | *client-side only* — see note below |
| No bookings in the past | past dates disabled in the picker | model validation → **422** |

> **On weekday-only:** this is currently enforced in the UI. Client-side checks are a
> UX convenience, not a security boundary — a direct API call could still create a
> weekend booking. To make it a hard rule, add a model validation in
> `backend/app/models/booking.rb` (reject `booking_date.saturday? || .sunday?`); the
> frontend already surfaces the resulting `422` as a toast.

---

## Architecture: separation of concerns

The evaluation criteria call out *"avoid writing database queries directly inside your
API route handlers."* The backend uses a thin-controller pattern:

```
Request
  └─ Controller        (parses params, calls a service, renders the result)
       └─ Service       (all business logic + Active Record queries live here)
            └─ Model    (validations, scopes, relationships)
                 └─ DB  (unique indexes = the hard guarantees)
```

- **Controllers** (`app/controllers/api/v1/*`) never build queries — each action calls
  a service and hands the `ServiceResult` to `render_result`.
- **Service objects** (`app/services/**`): `Auth::AuthenticateUser`,
  `Desks::AvailabilityQuery` (N+1-free dashboard read), `Bookings::CreateBooking`
  (maps conflicts to **409**), `Bookings::CancelBooking`. Each returns a uniform
  `ServiceResult`.
- **Serializers** (`app/serializers/*`) own the JSON shape.
- **`ErrorHandler` concern** centralizes `rescue_from` so exceptions become consistent
  JSON error envelopes with correct HTTP status codes.

---

## API reference

Base URL: `http://localhost:3001/api/v1`.
All errors return `{ "errors": ["message", ...] }`. Protected routes require
`Authorization: Bearer <token>`.

| Method   | Path                 | Auth | Description |
|----------|----------------------|------|-------------|
| `POST`   | `/auth/register`     | —    | Create a user → `{ user, token }` (**201**); **422** on validation. |
| `POST`   | `/auth/login`        | —    | `{ user, token }` (**200**) or **401**. |
| `GET`    | `/auth/me`           | ✅   | Current user from the token. |
| `GET`    | `/desks?date=YYYY-MM-DD&zone=…` | ✅ | Every desk annotated with `status`, `booking_id`, and `booked_by_me` for that date. **400** on a bad date. |
| `GET`    | `/desks/:id?date=…`  | ✅   | A single desk's status for a date. |
| `GET`    | `/bookings`          | ✅   | The current user's upcoming reservations (with desk info). |
| `POST`   | `/bookings`          | ✅   | Body `{ booking: { desk_id, booking_date } }`. **201** on success; **409** if the desk is taken *or* you already have a desk that day; **422** on validation. |
| `DELETE` | `/bookings/:id`      | ✅   | Cancel your own booking (**204**); **403** if it isn't yours. |

### HTTP status codes used
`200` OK · `201` Created · `204` No Content · `400` Bad Request (bad date) ·
`401` Unauthorized · `403` Forbidden · `404` Not Found ·
`409` Conflict (desk taken / one-per-day) · `422` Unprocessable Entity (validation).

---

## Local setup (manual, without Docker)

### Prerequisites
- Ruby **3.2.2** (see `backend/.ruby-version`)
- Node.js **18+** and npm
- PostgreSQL **14+** running locally

### 1. Backend (Rails API → http://localhost:3001)

```bash
cd backend
bundle install
cp .env.example .env          # set DB creds; generate a JWT secret with: bin/rails secret
bin/rails db:create db:migrate db:seed   # (or: bin/setup)
bin/rails server
```

> If you're upgrading an existing dev database, run `bin/rails db:migrate` to pick up
> the `(user_id, booking_date)` unique index. If the DB already contains a user with
> two bookings on one day, clear the duplicates (or `bin/rails db:reset`) before the
> index can be created.

### 2. Frontend (React app → http://localhost:5173)

```bash
cd frontend
npm install
npm run dev
```

Demo login: `demo@deskflex.app` / `password123`.

---

## Frontend features

- **Guided flow** — after sign-in you land on a **home page** that greets you and asks which weekday you're coming in. It shows live availability for the date you're eyeing (an occupancy ring + open-desk count) and your upcoming bookings, then routes you to the floor plan for the chosen date (`/book?date=YYYY-MM-DD`).
- **Live floor plan (the signature)** — the office is drawn as an interactive **blueprint**: zones are rooms, desks are nodes placed by a deterministic layout engine that fills the viewport. Open desks glow **mint**, your own booking glows **violet**, taken desks recede into the dark — availability is read spatially, at a glance.
- **Orchestrated motion** — on load the grid fades in, a scan-line sweeps the floor, and desks resolve into place; hover lifts a desk and intensifies its glow; selecting one springs in a booking drawer. `prefers-reduced-motion` is honored.
- **Real-time availability** — the floor polls every 12s (silently) so desks others grab update on their own; a pulsing **"Live"** indicator shows it's auto-refreshing.
- **My bookings tab** — an animated tab switcher (with a count badge) lists your upcoming reservations with one-click cancel, kept in sync with the floor.
- **Booking rules in the UI** — clicking a desk taken by someone shows "already booked by someone else"; trying to book a second desk in a day is blocked with a toast and a "you're booked at NW-03 today" banner; a lost race (**409**) refetches and toasts.
- **Zoom & scroll-to-pan** on the canvas; **occupancy ring** + Open/Taken counts; **date stepper** (weekday-only, UTC-safe) and **filters** (zone focus dims other rooms; availability dims non-matching desks in place).
- **Auth form validation** — email format on both forms; on sign-up, a live password checklist (8+ chars, one uppercase, one special character); show/hide password and a Caps-Lock warning. Sign-in validates email + that a password is present (composition rules belong at sign-up, not login).

### Design

A deliberate identity, not a template. Type pairs **Bricolage Grotesque** (display)
with **Hanken Grotesk** (body) and **IBM Plex Mono** for desk codes and data labels —
the mono reads like drafting annotations. The palette is a cool paper chrome wrapped
around a deep **blueprint-navy** canvas, with a three-color semantic system
(**mint** = open, **violet** = yours, **slate** = taken) so the only "hot" color is the
one you can act on. The luminous blueprint is the single bold move; everything around
it stays quiet. Responsive to mobile, visible keyboard focus, reduced-motion respected.
Tokens live in `frontend/tailwind.config.js`.

---

## Tests

The backend includes RSpec + FactoryBot in the Gemfile:

```bash
cd backend && bundle exec rspec
```

---

## Notes & next steps

- `Gemfile.lock` and `package-lock.json` are generated on first install and should
  then be committed.
- Production reads a single `DATABASE_URL` and requires `JWT_SECRET_KEY` to be set.
- Natural extensions: server-side weekday enforcement, half-day slots, drag-to-pan +
  pinch-zoom, keyboard navigation of the floor plan, a saved-favorite desk, an admin
  weekly occupancy view, and email reminders.
