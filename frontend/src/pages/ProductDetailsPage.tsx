import { useParams } from "react-router-dom";
import { useProduct } from "../hooks/catalog/products";
import AddToCart from "../components/product/AddToCart";
import VolumeDiscounts from "../components/product/VolumeDiscounts";
import ErrorState from "../components/common/ErrorState";

export default function ProductDetailsPage() {
  const { productSlug } = useParams<{ productSlug: string }>();

  const { data: product, isLoading, isError } = useProduct(productSlug || "");

  if (isLoading) {
    return <ErrorState type="loading" message="Loading product details..." />;
  }

  if (isError || !product) {
    return (
      <ErrorState
        type="not-found"
        message="The product you were looking for was not found."
      />
    );
  }

  const basePrice = product.base_price || 0;

  const isDescriptionLong =
    product.description && product.description.length > 150;

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-8 pt-10 lg:pt-14 pb-12 flex flex-col gap-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-center">
        <div className="bg-bg-surface border border-border-base/20 rounded-2xl p-6 flex items-center justify-center sticky top-24 w-full h-[450px] lg:h-[500px] shadow-[0_4px_24px_rgba(38,84,124,0.10)]">
          {product.main_image_url ? (
            <img
              src={product.main_image_url}
              alt={product.name || "Product image"}
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            <div className="w-full h-full bg-bg-base rounded-xl flex items-center justify-center border border-dashed border-border-base/30">
              <span className="text-text-muted text-sm">
                No image available
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6 justify-center">
          <div className="border-b border-border-base/10 pb-4">
            <h1 className="text-3xl font-bold text-text-primary tracking-tight">
              {product.name}
            </h1>
            <div className="flex flex-wrap gap-4 items-center mt-3 text-sm">
              <p className="text-text-muted">
                SKU:{" "}
                <span className="font-mono text-text-primary font-medium">
                  {product.sku}
                </span>
              </p>
              {!product.is_active && (
                <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider border border-red-200">
                  Archival product
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-text-body leading-relaxed text-sm lg:text-base line-clamp-3">
              {product.description ||
                "No additional description available for this product."}
            </p>
            {isDescriptionLong && (
              <a
                href="#full-description"
                className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors w-fit"
              >
                Read more
              </a>
            )}
          </div>
          <div>
            <p className="text-text-body leading-relaxed text-sm lg:text-base whitespace-pre-line line-clamp-4">
              {product.description ||
                "Brak dodatkowego opisu dla tego produktu."}
            </p>
            {product.description && (
              <button
                onClick={() =>
                  document
                    .getElementById("product-description")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="mt-2 text-sm text-accent hover:text-primary font-medium transition-colors cursor-pointer"
              >
                Read more
              </button>
            )}
          </div>

          {/* Price & Stock */}
          <div className="flex flex-col gap-2 bg-bg-base p-4 rounded-xl border border-border-base/20 shadow-sm">
            <div className="text-3xl font-bold text-text-primary font-mono">
              ${Number(basePrice).toFixed(2)}
            </div>

            <div className="text-sm font-medium flex items-center gap-2">
              {product.stock_quantity > 0 && product.is_active ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-green-700">
                    In stock ({product.stock_quantity} pcs.)
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-red-600">Product unavailable</span>
                </>
              )}
            </div>
          </div>

          <AddToCart
            stock={product.stock_quantity}
            disabled={!product.is_active || product.stock_quantity <= 0}
          />
        </div>
      </div>

      <hr className="border-border-base/10" />

      <section className="w-full">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-text-primary">
            Wholesale price list and quantity discounts
          </h2>
          <p className="text-sm text-text-muted mt-1">
            The discount is automatically applied in the shopping cart once the
            specified quantity threshold is exceeded.
          </p>
        </div>
        <VolumeDiscounts
          discounts={product.volume_discounts}
          basePrice={basePrice}
        />
      </section>

      <section id="full-description" className="w-full scroll-mt-28">
        <h2 className="text-xl font-bold mb-4 text-text-primary">
          Product description
        </h2>
        <div className="bg-bg-surface border border-border-base/20 rounded-xl p-6 shadow-sm">
          <p className="text-text-body leading-relaxed text-sm lg:text-base whitespace-pre-line">
            {product.description ||
              "No additional description available for this product."}
          </p>
        </div>
      </section>

      <section className="border-t border-border-base/10 pt-8 mt-4">
        <h2 className="text-xl font-bold mb-6 text-text-primary">
          Similar products
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((placeholderId) => (
            <div
              key={placeholderId}
              className="border border-border-base/10 rounded-xl p-4 bg-bg-surface text-center text-xs text-text-muted"
            >
              Recommendation carousel placeholder
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
