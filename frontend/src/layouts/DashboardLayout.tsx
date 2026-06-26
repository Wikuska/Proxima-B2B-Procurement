import { NavLink, Outlet } from "react-router-dom";

export interface TabItem {
  to: string;
  label: string;
}

interface DashboardLayoutProps {
  title: string;
  tabs: TabItem[];
}

const tabBase =
  "block w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 mb-1";
const tabActive = "bg-primary text-white shadow-md";
const tabInactive = "text-text-muted hover:text-primary hover:bg-accent/10";

export default function DashboardLayout({ title, tabs }: DashboardLayoutProps) {
  return (
    <div className="max-w-7xl mx-auto mt-12 px-4 w-full">
      <h1 className="text-2xl font-bold text-text-main mb-6">{title}</h1>

      <div className="flex flex-col md:flex-row border border-border-base/30 rounded-2xl shadow-sm min-h-[650px] overflow-hidden">
        <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border-base/30 p-6 shrink-0 bg-bg-surface z-10">
          <nav className="flex flex-col">
            {tabs.map(({ to, label }) => (
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

        <main className="flex-1 p-6 md:p-8 bg-bg-base">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
