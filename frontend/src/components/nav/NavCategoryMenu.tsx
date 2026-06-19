import { type CategoryResponse } from "../../api/catalog";
import { Link } from "react-router-dom";

interface NavCategoryMenuProps {
  categories: CategoryResponse[];
  onClose: () => void;
}

export default function NavCategoryMenu({
  categories,
  onClose,
}: NavCategoryMenuProps) {
  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[800px] bg-bg-surface border border-border-base/30 rounded-xl shadow-xl p-5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="grid grid-cols-3 gap-4">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/products/${category.slug}`}
            onClick={onClose}
            className="group relative flex flex-col p-4 rounded-xl bg-bg-base border border-border-base/20 hover:border-accent/50 hover:bg-white hover:shadow-sm transition-all duration-300 overflow-hidden"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top"></div>
            <div className="flex justify-between items-start mb-1.5">
              <span className="text-sm font-semibold text-text-main group-hover:text-accent transition-colors">
                {category.name}
              </span>
              <span className="text-accent opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-xs font-bold">
                →
              </span>
            </div>
            <span className="text-xs text-text-muted leading-snug">
              {category.description ||
                "Browse available products in this category."}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
