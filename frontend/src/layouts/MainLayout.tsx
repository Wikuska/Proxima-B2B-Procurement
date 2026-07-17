import { Outlet, useLocation } from "react-router-dom";
import NavBar from "../components/nav/NavBar";
import { useCartSync } from "../hooks/cart/useCartSync";

function isCheckoutWizardPath(pathname: string): boolean {
  return (
    pathname === "/checkout" ||
    pathname.startsWith("/checkout/details") ||
    pathname.startsWith("/checkout/delivery") ||
    pathname.startsWith("/checkout/summary")
  );
}

export default function MainLayout() {
  useCartSync();
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-bg-base text-text-main flex flex-col font-sans">
      <NavBar variant={isCheckoutWizardPath(pathname) ? "checkout" : "default"} />

      <main className="flex flex-grow flex-col">
        <Outlet />
      </main>

      <footer className="bg-bg-surface border-t border-border-base/30 py-5">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-text-muted">
          &copy; {new Date().getFullYear()} Proxima. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
