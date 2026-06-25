# AGENTS.md — Proxima B2B/B2C Procurement Platform

AI agent guide for this repository. Read this before making changes.

## Project overview
Proxima is a B2B + B2C sales platform for laboratory supplies. Unauthenticated users can browse
the full catalog; B2B-only products can be viewed by everyone but only purchased by company
accounts. Core business rules: invoice freezing, historical price locking, per-company and
volume-based discounts, email double opt-in, and company verification via NIP.

## Tech stack
- Backend: Python 3.12, FastAPI, async SQLAlchemy 2.0 (`Mapped[]`), Pydantic v2, Alembic,
  PostgreSQL, JWT (PyJWT), Argon2 password hashing (pwdlib), pytest + pytest-asyncio.
- Frontend: React 19, TypeScript, Vite, TanStack Query (server state), Zustand (auth/client
  state), react-hook-form + Zod, Tailwind CSS v4, react-router v7, sonner (toasts).

## Repository layout
- `backend/app/models/`   SQLAlchemy ORM models + `enums.py`.
- `backend/app/schemas/`  Pydantic request/response DTOs.
- `backend/app/crud/`     DB access only (queries). No business logic.
- `backend/app/services/` Business logic. Orchestrates crud + raises domain exceptions.
- `backend/app/routers/`  HTTP endpoints. Thin — delegate to services.
- `backend/app/core/`     settings, security (JWT/hashing), exceptions.
- `backend/app/tests/`    pytest suite (savepoint-isolated DB fixtures).
- `frontend/src/api/`     `client.ts` (apiFetch wrapper) + per-domain API modules.
- `frontend/src/hooks/`   TanStack Query hooks.
- `frontend/src/store/`   Zustand stores.
- `frontend/src/pages/`, `components/`, `layouts/`  UI.

## Architecture rules (backend)
- Strict layering: `router → service → crud → model`. Never call crud directly from a router;
  never put business logic in crud.
- Raise domain exceptions from `core/exceptions.py` (subclasses of `AppException`); the global
  handler in `main.py` maps them to HTTP responses. Do not raise `HTTPException` in services.
- All primary keys are UUIDs (anti-enumeration). Money is `Numeric(10, 2)` / `Decimal` — never
  float. Timestamps are timezone-aware.
- Preserve historical immutability: orders snapshot billing data (`billing_nip`,
  `billing_company_name`) and line items snapshot `unit_price`, `product_name`, `product_sku`.
  Never recompute these from current `Product`/`Company` rows.
- Use async SQLAlchemy throughout (`AsyncSession`, `select()`, `await db.execute/scalars`).

## Conventions
- Language: **English everywhere** — code, identifiers, comments, commit messages, and
  user-facing UI strings.
- Backend: type-annotate everything; `snake_case`. Frontend: `PascalCase` components,
  `camelCase` functions/vars; API response interfaces mirror backend schema field names
  (`snake_case`) exactly.
- Frontend data fetching goes through `apiFetch` (`src/api/client.ts`) — it injects the JWT and
  handles 401. Don't call `fetch` directly. Server state lives in TanStack Query; only auth/token
  state lives in Zustand.

## Workflow
- Build features as **vertical slices**, one section at a time, in this order: **API →
  tests → frontend**. Finish and verify a slice end-to-end before starting the next section.
  Do not build the entire backend first and wire up the frontend later.

## Commands
- Backend deps: `pip install -r backend/requirements.txt` (venv at `backend/venv`).
- Run API: from `backend/`, `uvicorn app.main:app --reload`.
- Migrations: from `backend/`, `alembic revision --autogenerate -m "..."` then `alembic upgrade head`.
- Seed data: from `backend/`, `python seed.py` (test users password: `Password123`).
- Tests: from `backend/`, `pytest`.
- DB (local): `docker-compose up -d` (Postgres on :5433, pgAdmin on :5050).
- Frontend: from `frontend/`, `npm run dev` / `npm run build` / `npm run lint`.

## Guardrails
- Never commit real secrets. `backend/.env` holds `DATABASE_URL`, `SECRET_KEY`,
  `TEST_DATABASE_URL`, `FRONTEND_URL`.
- After changing models, always create an Alembic migration — don't rely on `create_all`.
- Add/adjust tests in `backend/app/tests/` for new endpoints, following the existing
  fixtures (`async_client`, `db_session`, `user_factory`).
