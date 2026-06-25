import { useParams } from "react-router-dom";
import ProductCard from "../components/catalog/ProductCard";
import { useProducts } from "../hooks/catalog/products";
import { useCategories } from "../hooks/catalog/categories";
import { ApiError } from "../api/client";
import { useUrlPagination } from "../hooks/common/urlPagination";
import ErrorState from "../components/common/ErrorState";
import CatalogHeader from "../components/catalog/CatalogHeader";
import CatalogSidebar from "../components/catalog/CatalogSidebar";
import PaginationControls from "../components/catalog/PaginationControls";

export default function ProductsPage() {
  const { categorySlug } = useParams<{ categorySlug: string }>();

  const { data: categories } = useCategories();
  const currentCategory = categories?.find((c) => c.slug === categorySlug);

  const { page, size, handlePageChange } = useUrlPagination(0);

  const { data, isLoading, isError, error, isPlaceholderData } = useProducts({
    category_slug: categorySlug || "",
    page,
    size,
  });

  useUrlPagination(data?.pages || 0);

  if (isLoading)
    return (
      <ErrorState type="loading" message="Loading laboratory equipment..." />
    );

  if (error instanceof ApiError && error.status === 404) {
    return (
      <ErrorState
        type="not-found"
        message={`We couldn't find the "${categorySlug}" category.`}
      />
    );
  }

  if (isError) return <ErrorState type="error" message={error?.message} />;
  if (!data)
    return <ErrorState type="empty" message="Received an empty response." />;

  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-8">
      <div id="catalog-top" className="scroll-mt-24" aria-hidden="true" />
      <CatalogHeader
        category={currentCategory}
        totalProducts={data.total}
        currentPage={page}
        pageSize={size}
      />

      <div className="flex flex-col md:flex-row gap-8">
        <CatalogSidebar />

        <div className="flex-1 flex flex-col">
          {data.items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center bg-bg-surface border border-border-base/20 rounded-xl p-10">
              <p className="text-text-muted">
                No products found in this category.
              </p>
            </div>
          ) : (
            <>
              <div
                className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 transition-opacity duration-300 ${
                  isPlaceholderData
                    ? "opacity-50 pointer-events-none grayscale-[20%]"
                    : "opacity-100"
                }`}
              >
                {data.items.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              <PaginationControls
                currentPage={page}
                totalPages={data.pages}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
