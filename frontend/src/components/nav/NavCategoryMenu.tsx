import { type CategoryResponse } from "../../api/catalog";
import { Link } from "react-router-dom";

interface NavCategoryMenuProps {
  categories: CategoryResponse[];
  /** Whether the menu should be entering (`true`) or exiting (`false`). */
  isOpen: boolean;
  onClose: () => void;
}

export default function NavCategoryMenu({
  categories,
  isOpen,
  onClose,
}: NavCategoryMenuProps) {
  return (
    <div
      className={`absolute top-full left-1/2 -translate-x-1/2 mt-4.5 w-[800px] bg-bg-surface border border-border-base/30 rounded-xl shadow-xl p-5 z-50 origin-top ${
        isOpen ? "animate-pop-down" : "animate-pop-up"
      }`}
    >
      <div className="mb-5 pb-5 border-b border-border-base/20">
        <Link
          to="/catalog"
          onClick={onClose}
          className="group relative flex items-center justify-between p-4 rounded-xl bg-accent/5 border border-accent/20 hover:border-accent/50 hover:bg-white hover:shadow-sm transition-all duration-300 overflow-hidden"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent scale-y-100 origin-top"></div>

          <div>
            <span className="block text-sm font-bold text-text-main group-hover:text-accent transition-colors mb-1">
              Browse All Products
            </span>
            <span className="text-xs text-text-muted leading-snug">
              Explore our complete catalog of laboratory equipment and chemical
              reagents.
            </span>
          </div>

          <span className="text-accent opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 font-bold text-lg px-2">
            →
          </span>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/catalog/${category.slug}`}
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
