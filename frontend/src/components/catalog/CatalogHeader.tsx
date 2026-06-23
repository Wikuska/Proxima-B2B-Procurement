import { type CategoryResponse } from "../../api/catalog";

interface CatalogHeaderProps {
  category?: CategoryResponse;
  totalProducts: number;
  currentPage: number;
  pageSize: number;
}

export default function CatalogHeader({
  category,
  totalProducts,
  currentPage,
  pageSize,
}: CatalogHeaderProps) {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalProducts);

  return (
    <div className="flex justify-between items-end mb-8 border-b border-border-base/20 pb-4">
      <div>
        <h1 className="text-3xl font-bold text-text-main tracking-tight">
          {category ? category.name : "All Products"}
        </h1>

        {category?.description && (
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

      <div className="hidden md:flex items-center gap-2 text-sm">
        <span className="text-text-muted">Sort by:</span>
        <select className="bg-bg-surface border border-border-base/30 rounded-md px-3 py-1.5 text-text-main focus:outline-none focus:border-accent">
          <option>Name (A-Z)</option>
          <option>Price (Low to High)</option>
          <option>Price (High to Low)</option>
        </select>
      </div>
    </div>
  );
}
