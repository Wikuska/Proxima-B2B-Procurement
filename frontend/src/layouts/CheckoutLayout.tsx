import { Link, Outlet } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function CheckoutLayout() {
  return (
    <div className="min-h-screen bg-bg-base text-text-main flex flex-col font-sans">
      <header className="bg-bg-surface shadow-sm sticky top-0 z-50 border-b border-border-base/10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            to="/"
            className="text-2xl font-bold text-primary tracking-wide leading-none"
          >
            pro<span className="text-accent">xima</span>.
          </Link>
          <Link
            to="/cart"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-primary transition-colors"
          >
            <ArrowLeft size={16} />
            Back to cart
          </Link>
        </div>
      </header>

      <main className="flex-grow">
        <Outlet />
      </main>
    </div>
  );
}
