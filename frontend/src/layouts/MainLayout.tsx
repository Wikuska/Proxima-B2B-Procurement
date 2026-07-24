import { useEffect, useRef } from "react";
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
  const { pathname, search } = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, [pathname, search]);

  return (
    <div className="h-dvh flex flex-col bg-bg-base text-text-main font-sans overflow-hidden">
      <NavBar variant={isCheckoutWizardPath(pathname) ? "checkout" : "default"} />

      <main
        ref={mainRef}
        className="flex-1 min-h-0 overflow-y-auto flex flex-col"
      >
        <div className="flex-1 flex flex-col min-h-0">
          <Outlet />
        </div>

        <footer className="bg-bg-surface border-t border-border-base/30 py-5 shrink-0">
          <div className="max-w-7xl mx-auto px-4 text-center text-xs text-text-muted">
            &copy; {new Date().getFullYear()} Proxima. All rights reserved.
          </div>
        </footer>
      </main>
    </div>
  );
}
