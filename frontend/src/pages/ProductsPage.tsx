import { useParams } from "react-router-dom";
import ProductCard from "../components/catalog/ProductCard";
import { useProducts } from "../hooks/catalog/products";
import { useCategories } from "../hooks/catalog/categories";
import {
  useCatalogParams,
  useClampCatalogPage,
} from "../hooks/catalog/useCatalogParams";
import { ApiError } from "../api/client";
import ErrorState from "../components/common/ErrorState";
import CatalogHeader from "../components/catalog/CatalogHeader";
import CatalogSidebar from "../components/catalog/CatalogSidebar";
import PaginationControls from "../components/catalog/PaginationControls";

export default function ProductsPage() {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const { q, sort, page, size, setSort, handlePageChange } = useCatalogParams();

  const { data: categories } = useCategories();
  const currentCategory =
    !q && categorySlug
      ? categories?.find((c) => c.slug === categorySlug)
      : undefined;

  const { data, isLoading, isError, error, isPlaceholderData } = useProducts({
    category_slug: q ? undefined : categorySlug || undefined,
    search_query: q,
    sort_by: sort,
    page,
    size,
  });

  useClampCatalogPage(data?.pages ?? 0);

  if (isLoading) {
    return (
      <ErrorState type="loading" message="Loading laboratory equipment..." />
    );
  }

  if (!q && error instanceof ApiError && error.status === 404) {
    return (
      <ErrorState
        type="not-found"
        message={`We couldn't find the "${categorySlug}" category.`}
      />
    );
  }

  if (isError) return <ErrorState type="error" message={error?.message} />;
  if (!data) {
    return <ErrorState type="empty" message="Received an empty response." />;
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 lg:px-8 py-8">
      <div id="catalog-top" className="scroll-mt-24" aria-hidden="true" />
      <CatalogHeader
        category={currentCategory}
        searchQuery={q}
        totalProducts={data.total}
        currentPage={page}
        pageSize={size}
        sort={sort}
        onSortChange={setSort}
      />

      <div className="grid grid-cols-1 md:grid-cols-[16rem_minmax(0,1fr)] gap-8 w-full">
        <CatalogSidebar />

        <div className="min-w-0 w-full">
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 transition-opacity duration-300 ${
              isPlaceholderData
                ? "opacity-50 pointer-events-none grayscale-[20%]"
                : "opacity-100"
            }`}
          >
            {data.items.length === 0 ? (
              <div className="col-span-full min-h-[500px] flex items-center justify-center bg-bg-surface border border-border-base/20 rounded-xl p-10">
                <p className="text-text-muted">
                  {q
                    ? `No products found for "${q}".`
                    : "No products found in this category."}
                </p>
              </div>
            ) : (
              data.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </div>

          {data.items.length > 0 && (
            <PaginationControls
              currentPage={page}
              totalPages={data.pages}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}
