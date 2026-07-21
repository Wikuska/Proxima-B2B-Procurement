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
- `backend/app/ai/` Optional local embeddings / hybrid search (no external AI APIs).
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
- Preserve historical immutability: orders snapshot fiscal data in a `BillingDocument` row (1:1
  with `Order`, `cascade all, delete-orphan`). `BillingDocument` stores `document_type`
  (`RECEIPT | PERSONAL_INVOICE | COMPANY_INVOICE`), names, NIP, and billing address — all frozen
  at order time. Line items also snapshot `unit_price`, `product_name`, `product_sku`.
  Never recompute these from current `Product`/`Company` rows.
- `purchase_type` (B2B/B2C) is orthogonal to `document_type`. B2B always forces `COMPANY_INVOICE`
  (data auto-filled from `Company` + its `BILLING` `Address`). B2C allows any document type —
  COMPANY_INVOICE in B2C means manual entry, no company discount. `is_b2b_only` products are
  hard-blocked in B2C `purchase_type` (even for users with `company_id`).
- `Address.address_type` partitions company addresses: `SHIPPING` (book, many) vs `BILLING`
  (HQ/registered, at most one — partial unique index `ix_addresses_company_billing`).
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
- **Exception — cart store**: `src/store/cartStore.ts` is a deliberate second Zustand store.
  It holds `{ product_id, quantity, selected }` items and persists to localStorage for guests.
  For authenticated users, mutations call the API and replace store state with the authoritative
  server response; localStorage is not written (partialize returns empty items when a token
  exists). This is a conscious trade-off: cart needs to survive page refresh for guests and be
  globally accessible without prop-drilling, which React Query alone cannot provide.
- **Exception — purchase mode store**: `src/store/purchaseModeStore.ts` is a deliberate third
  Zustand store. It holds `mode: "COMPANY" | "PRIVATE"` and persists to localStorage. This is
  a UI preference, not server state — it drives how pricing data is displayed (company vs. base
  price) across the whole app (catalog, product page, cart). Only meaningful for users with a
  `company_id`; the backend ignores mode when no company exists. React Query cannot satisfy
  this because the preference is local and must outlive component mounts.
- **Purchase mode → order type**: `PurchaseMode` (`COMPANY` / `PRIVATE`) maps to
  `purchase_type` (`B2B` / `B2C`) when placing an order: `COMPANY` + `company_id` → B2B,
  otherwise B2C. Users choose mode on the cart page (or navbar toggle); checkout
  snapshots that mode at entry and does not offer a separate purchase-type selector.
  `purchase_type` on `Order` remains the immutable backend snapshot.
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
  Postgres image is `pgvector/pgvector:pg15` (needed for semantic search). If you
  previously used plain `postgres:15-alpine` and `CREATE EXTENSION vector` fails,
  recreate the DB volume (`docker compose down`, remove volume `b2b_db_data`, then
  `docker compose up -d`) and re-run migrations + seed.
- Frontend: from `frontend/`, `npm run dev` / `npm run build` / `npm run lint`.
- Optional semantic search: from `backend/`, `pip install -r requirements-ai.txt`, set
  `SEMANTIC_SEARCH_ENABLED=true`, then `python -m app.scripts.embed_products`.
  Without that, catalog search stays on Postgres FTS.

## Frontend color palette (Tailwind CSS custom properties)
These CSS variables are defined in `frontend/src/index.css` and map to Tailwind utility classes
(`bg-primary`, `text-accent`, `bg-bg-surface`, etc.). Always use them — never hardcode hex values.

```css
/* Brand */
--color-primary: #26547C;   /* Dusk Blue  — navbar, action buttons */
--color-accent:  #60B2E5;   /* Fresh Sky  — hover, focus, links */

/* Backgrounds */
--color-bg-base:    #F8FAFC; /* App background, sterile look */
--color-bg-surface: #FFFFFF; /* Cards, forms */

/* Text */
--color-text-main:  #0F172A; /* Slate 900 — primary text */
--color-text-muted: #94A3B8; /* Slate 400 — helper text, placeholders */

/* Borders */
--color-border-base:  #94A3B8; /* Slate 400 — inactive inputs */
--color-border-focus: #60B2E5; /* Fresh Sky — active inputs */
```

## Guardrails
- Never commit real secrets. `backend/.env` holds `DATABASE_URL`, `SECRET_KEY`,
  `TEST_DATABASE_URL`, `FRONTEND_URL`.
- After changing models, always create an Alembic migration — don't rely on `create_all`.
- Add/adjust tests in `backend/app/tests/` for new endpoints, following the existing
  fixtures (`async_client`, `db_session`, `user_factory`).
