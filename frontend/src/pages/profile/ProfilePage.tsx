import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/user/useAuth";
import { profileTabs } from "../../config/profileTabs";
import { getInitials } from "../../utils/getInitials";

const tabBase =
  "block w-full text-left px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 mb-1";
const tabActive = "bg-primary text-white shadow-md";
const tabInactive = "text-text-muted hover:text-primary hover:bg-slate-100";

/**
 * Only consumer of this dashboard shell — kept inline rather than a shared
 * layout (see `AppDashboardLayout` for the standalone /company variant).
 */
export default function ProfilePage() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const fullName = user ? `${user.first_name} ${user.last_name}` : "";

  return (
    <div className="max-w-7xl mx-auto px-4 w-full flex-1 min-h-0 flex flex-col pt-10 pb-6">
      <div className="flex items-center gap-3 mb-8 shrink-0">
        <div className="w-11 h-11 rounded-full bg-accent/20 text-accent flex items-center justify-center text-sm font-bold shrink-0">
          {getInitials(fullName)}
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-text-main leading-tight truncate">
            {fullName || "My Profile"}
          </h1>
          <p className="text-sm text-text-muted truncate">{user?.email}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row border mb-6 border-border-base/30 rounded-lg shadow-sm flex-1 min-h-0 overflow-hidden bg-bg-surface">
        <aside className="w-full md:w-60 border-b md:border-b-0 md:border-r border-border-base/30 p-6 shrink-0 bg-bg-surface z-10 overflow-y-auto">
          <nav className="flex flex-col">
            {profileTabs.map(({ to, label }) => {
              const isOrdersTab = to === "/profile/orders";
              const isActive = isOrdersTab
                ? pathname.startsWith("/profile/orders")
                : pathname === to || pathname.startsWith(`${to}/`);

              return (
                <NavLink
                  key={to}
                  to={to}
                  end={!isOrdersTab}
                  className={() =>
                    `${tabBase} ${isActive ? tabActive : tabInactive}`
                  }
                >
                  {label}
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 min-h-0 overflow-y-auto p-6 md:p-8 bg-bg-base">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
