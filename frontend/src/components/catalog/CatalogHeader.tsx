import { type CategoryResponse } from "../../api/catalog";
import type { CatalogSort } from "../../hooks/catalog/useCatalogParams";
import CustomSelect from "../common/CustomSelect";

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

  const sortOptions = [
    ...(isSearchMode
      ? [{ value: "relevance" as const, label: "Relevance" }]
      : []),
    { value: "name_asc" as const, label: "Name (A-Z)" },
    { value: "price_asc" as const, label: "Price (Low to High)" },
    { value: "price_desc" as const, label: "Price (High to Low)" },
  ];

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
        <CustomSelect
          value={effectiveSort}
          onChange={(value) => onSortChange(value as CatalogSort)}
          options={sortOptions}
          aria-label="Sort products"
          className="min-w-[12rem]"
          triggerClassName="bg-bg-surface border-border-base/30 min-w-0"
        />
      </div>
    </div>
  );
}
