import { type CategoryResponse } from "../../api/catalog";
import type { CatalogSort } from "../../hooks/catalog/useCatalogParams";

interface CatalogHeaderProps {
  category?: CategoryResponse;
  searchQuery?: string;
  totalProducts: number;
  currentPage: number;
  pageSize: number;
  sort?: CatalogSort;
  onSortChange: (sort: CatalogSort) => void;
}

export default function CatalogHeader({
  category,
  searchQuery,
  totalProducts,
  currentPage,
  pageSize,
  sort,
  onSortChange,
}: CatalogHeaderProps) {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalProducts);
  const isSearchMode = !!searchQuery;
  const effectiveSort = sort ?? (isSearchMode ? "relevance" : "name_asc");

  const title = isSearchMode
    ? `Search results for "${searchQuery}"`
    : category
      ? category.name
      : "All Products";

  return (
    <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-end mb-8 border-b border-border-base/20 pb-4">
      <div>
        <h1 className="text-3xl font-bold text-text-main tracking-tight">
          {title}
        </h1>

        {!isSearchMode && category?.description && (
          <p className="text-base text-text-main/80 mt-2 max-w-3xl">
            {category.description}
          </p>
        )}

        {totalProducts > 0 && (
          <p className="text-sm text-text-muted mt-3 font-medium">
            Showing {startItem}-{endItem} of {totalProducts} products
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm shrink-0">
        <span className="text-text-muted">Sort by:</span>
        <select
          value={effectiveSort}
          onChange={(event) => onSortChange(event.target.value as CatalogSort)}
          className="bg-bg-surface border border-border-base/30 rounded-md px-3 py-1.5 text-text-main focus:outline-none focus:border-accent"
        >
          {isSearchMode && <option value="relevance">Relevance</option>}
          <option value="name_asc">Name (A-Z)</option>
          <option value="price_asc">Price (Low to High)</option>
          <option value="price_desc">Price (High to Low)</option>
        </select>
      </div>
    </div>
  );
}
