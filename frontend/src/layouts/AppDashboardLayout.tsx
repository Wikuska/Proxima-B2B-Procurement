import type { LucideIcon } from "lucide-react";
import { Bell, Store } from "lucide-react";
import { Link, NavLink, Outlet } from "react-router-dom";

export interface DashboardNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

interface DashboardUser {
  name: string;
  email: string;
}

interface AppDashboardLayoutProps {
  brandName: string;
  brandSubtitle: string;
  navItems: DashboardNavItem[];
  user: DashboardUser;
}

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

/**
 * Full-viewport app shell for authenticated dashboards (e.g. /company).
 * Deliberately outside `MainLayout` — no site NavBar/footer, own left
 * sidebar navigation instead. Mirrors `DashboardLayout`'s props-driven
 * approach but for a standalone, icon-driven sidebar layout.
 */
export default function AppDashboardLayout({
  brandName,
  brandSubtitle,
  navItems,
  user,
}: AppDashboardLayoutProps) {
  return (
    <div className="h-screen flex bg-bg-base text-text-main font-sans overflow-hidden">
      <aside className="w-64 shrink-0 bg-bg-surface border-r border-border-base/20 flex flex-col">
        <div className="h-16 flex items-center gap-2.5 px-6 border-b border-border-base/20 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm shrink-0">
            P
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-text-main leading-tight truncate">
              {brandName}
            </p>
            <p className="text-[11px] text-text-muted leading-tight truncate">
              {brandSubtitle}
            </p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "text-text-muted hover:text-primary hover:bg-slate-100"
                }`
              }
            >
              <Icon size={18} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border-base/20 flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-bold shrink-0">
            {getInitials(user.name)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-main truncate">
              {user.name}
            </p>
            <p className="text-xs text-text-muted truncate">{user.email}</p>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 bg-bg-surface border-b border-border-base/20 flex items-center justify-end gap-1.5 px-6 text-text-muted">
          <button
            type="button"
            aria-label="Notifications"
            className="p-2 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Bell size={18} />
          </button>
          <Link
            to="/"
            aria-label="Back to store"
            title="Back to store"
            className="p-2 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Store size={18} />
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-slate-100 shadow-inner">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
