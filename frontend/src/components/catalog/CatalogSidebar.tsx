import { Filter } from "lucide-react";

export default function CatalogSidebar() {
  return (
    <aside className="w-full md:w-64 shrink-0">
      <div className="sticky top-4 bg-bg-surface border border-border-base/20 rounded-xl p-5 h-[500px] flex flex-col">
        <div className="flex items-center gap-2 border-b border-border-base/20 pb-4 mb-4">
          <Filter size={18} className="text-accent" />
          <h2 className="font-semibold text-text-main">Filters</h2>
        </div>

        <div className="flex-1 flex items-center justify-center border-2 border-dashed border-border-base/30 rounded-lg">
          <p className="text-xs text-text-muted text-center px-4">
            Space reserved for <br /> category specific filters
          </p>
        </div>
      </div>
    </aside>
  );
}
