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
const tabInactive = "text-text-muted hover:text-primary hover:bg-slate-100";

export default function DashboardLayout({ title, tabs }: DashboardLayoutProps) {
  return (
    <div className="max-w-7xl mx-auto mt-10 px-4 w-full">
      {/* Restored big title, made it bolder and tighter */}
      <h1 className="text-3xl font-extrabold text-text-main mb-8 tracking-tight">
        {title}
      </h1>

      {/* Main wrapper: pure white */}
      <div className="bg-white flex flex-col md:flex-row border border-border-base/30 rounded-2xl shadow-sm min-h-[650px] overflow-hidden">
        {/* Sidebar: pure white */}
        <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border-base/30 p-6 shrink-0 bg-white z-10">
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

        {/* Right workspace: forced slate-50 to create depth */}
        <main className="flex-1 p-6 md:p-8 bg-slate-50 shadow-inner">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
