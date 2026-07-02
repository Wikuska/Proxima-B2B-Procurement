# UI Polish: Auth Modal, ProductCard, Company Dashboard

Three independent slices. Order: Slice 2 (ProductCard) and Slice 1 (Auth modal) are pure frontend; Slice 3 touches layout/routing. Slice 2 also touches `seed.py` data (no API/schema change).

## Slice 1 - Login/Registration as a route-addressable modal

Uses react-router v7 "background location" so the modal has its own URL (`/auth`, `?mode=register`) but renders over the blurred previous page. Full `AuthPage` stays as fallback for direct link visits.

- New generic modal `frontend/src/components/common/Modal.tsx`: portal to `document.body`, backdrop `bg-black/40 backdrop-blur-sm`, centered panel, close on Escape + backdrop click, basic focus handling, body scroll lock.
- Refactor the inner form area of [`frontend/src/pages/AuthPage.tsx`](frontend/src/pages/AuthPage.tsx) (tab switcher + SignInForm/CreateAccountForm) into a shared `frontend/src/components/auth/AuthPanel.tsx`. `AuthPage` reuses it (full-page fallback); a new `AuthModal.tsx` wraps it in `Modal`.
- [`frontend/src/App.tsx`](frontend/src/App.tsx): read `location.state.backgroundLocation`; render main `<Routes location={backgroundLocation || location}>` and, when a background exists, a second `<Routes>` with `/auth` -> `AuthModal`. Keep the plain `/auth` -> `AuthPage` route as fallback.
- Pass `state={{ backgroundLocation: location }}` (plus existing `from`) from every entry point that opens auth:
  - [`frontend/src/components/nav/NavAuthButtons.tsx`](frontend/src/components/nav/NavAuthButtons.tsx) "Log in" / "Register"
  - [`frontend/src/pages/CartPage.tsx`](frontend/src/pages/CartPage.tsx) "Proceed to Checkout"
  - [`frontend/src/components/cart/CartDropdown.tsx`](frontend/src/components/cart/CartDropdown.tsx) "Checkout"
- Closing modal navigates back to `backgroundLocation`. On successful sign-in, `SignInForm` closes the modal and navigates to `from` (e.g. `/checkout`) or stays on the background page; [`frontend/src/components/forms/SignInForm.tsx`](frontend/src/components/forms/SignInForm.tsx) gets an optional `onSuccess` path.
- [`frontend/src/components/common/ProtectedRoute.tsx`](frontend/src/components/common/ProtectedRoute.tsx) keeps redirecting to the full `AuthPage` (direct-URL case has no background) - acceptable, documented.

Known trade-offs: direct `/auth` link and the 401 handler in [`frontend/src/api/client.ts`](frontend/src/api/client.ts) show the full page (no blur); modal needs focus-trap/Escape (handled by `Modal`).

## Slice 2 - ProductCard redesign + product images

Restyle [`frontend/src/components/catalog/ProductCard.tsx`](frontend/src/components/catalog/ProductCard.tsx) to match the mockup:
- Badge moves to top-right, lighter pill style (keep text "B2B Only", keep `is_b2b_only` condition).
- Replace the small icon-only add button with a full-width primary "Add to Cart" button (icon + label) at the bottom, below the price block. Preserve all existing logic: `b2bBlocked`, out-of-stock, `isPending`, company-price display, toasts.
- Price shown above the button (strikethrough base + accent company price when applicable).

Images:
- Generate a consistent set of transparent/white-background lab product PNGs (approx. 10-14 covering the 7 categories, prioritizing named seeded products: Acetone HPLC Grade, Ethanol, HCl, Optical Microscope BX-200, Borosilicate Beaker 500mL, Micropipette Tips 200uL, benchtop centrifuge, UV/VIS spectrophotometer, analytical balance, spill kit, eyewash station, fume hood cabinet).
- Store them under `frontend/public/products/<slug>.png` and set `main_image_url = "/products/<slug>.png"` in [`backend/seed.py`](backend/seed.py). Remaining products keep `None` (existing placeholder).
- Review `mix-blend-multiply` in [`frontend/src/components/product/ProductImage.tsx`](frontend/src/components/product/ProductImage.tsx): fine for transparent/white assets on the white card; keep unless it darkens edges, in which case drop the blend for the catalog variant.
- Note: images take effect after re-running `python seed.py`.

## Slice 3 - Standalone /company dashboard with AppDashboardLayout

New app-shell layout `frontend/src/layouts/AppDashboardLayout.tsx` matching the mockup (left sidebar):
- Props-driven (mirrors current `DashboardLayout` style): `brand` (logo + "Lab Management"), `navItems: {to,label,icon}[]`, `user` footer (name/email/avatar), and topbar slot (search placeholder + notification/help icons). Content via `<Outlet />`.
- Left sidebar with icon nav items (lucide), active state highlighting, user card pinned to the bottom, `bg-bg-surface`/palette tokens per AGENTS.md.
- Full-viewport shell, completely outside `MainLayout` (no site NavBar/footer).

Routing - move `/company` out of the `MainLayout` group in [`frontend/src/App.tsx`](frontend/src/App.tsx):
- `/company` wrapped by `ProtectedRoute allow={["COMPANY_ADMIN","ADMIN"]}` + `CompanyPage` rebuilt on `AppDashboardLayout`.
- Nav items: Overview (new placeholder tab), Orders (existing `CompanyOrdersTab`), Members (`CompanyMembersTab`), Addresses (`CompanyAddressesTab`), Join requests (`JoinRequestsTab`), Settings (new placeholder). `index` redirects to `overview`.
- Add `frontend/src/pages/company/CompanyOverviewTab.tsx` and `CompanySettingsTab.tsx` as simple placeholders (no new backend endpoints).
- Update [`frontend/src/pages/company/CompanyPage.tsx`](frontend/src/pages/company/CompanyPage.tsx) to render `AppDashboardLayout` instead of `DashboardLayout`.

Navigation entry point:
- Remove the "Company" `NavLink` (+ its `RoleGuard`) from [`frontend/src/components/nav/NavBar.tsx`](frontend/src/components/nav/NavBar.tsx).
- In [`frontend/src/components/nav/NavAuthButtons.tsx`](frontend/src/components/nav/NavAuthButtons.tsx) profile dropdown, add a "Go to dashboard" item -> `/company`, shown only for `COMPANY_ADMIN`/`ADMIN` (via `useAuth().isB2B`), placed directly above the "Log out" divider.

`/profile` keeps the existing `DashboardLayout` (unchanged).

## Verification
- `npm run lint` and `npm run build` in `frontend/` after each slice.
- Manual: guest checkout -> auth modal over blurred cart, login returns to `/checkout`; direct `/auth` shows full page; catalog cards match mockup; admin sees "Go to dashboard" and `/company` renders the standalone shell with no site navbar.
- Re-run `python seed.py` (from `backend/`) to load new image URLs.