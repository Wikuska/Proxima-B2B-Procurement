import { NavLink, Outlet } from "react-router-dom";
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
  const fullName = user ? `${user.first_name} ${user.last_name}` : "";

  return (
    <div className="max-w-7xl mx-auto mt-10 px-4 w-full">
      <div className="flex items-center gap-3 mb-8">
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

      <div className="bg-white flex flex-col md:flex-row border border-border-base/30 rounded-lg shadow-sm min-h-[650px] overflow-hidden">
        <aside className="w-full md:w-60 border-b md:border-b-0 md:border-r border-border-base/30 p-6 shrink-0 bg-white z-10">
          <nav className="flex flex-col">
            {profileTabs.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end
                className={({ isActive }) =>
                  `${tabBase} ${isActive ? tabActive : tabInactive}`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-6 md:p-8 bg-bg-surface">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
