import { useParams } from "react-router-dom";
import { useProduct, useRelatedProducts } from "../hooks/catalog/products";
import { useProductPricing } from "../hooks/pricing/useProductPricing";
import { usePurchaseMode } from "../store/purchaseModeStore";
import { useAuth } from "../hooks/user/useAuth";
import AddToCart from "../components/product/AddToCart";
import VolumeDiscounts from "../components/product/VolumeDiscounts";
import ErrorState from "../components/common/ErrorState";
import ProductImage from "../components/product/ProductImage";
import ProductRail from "../components/catalog/ProductRail";

export default function ProductDetailsPage() {
  const { productSlug } = useParams<{ productSlug: string }>();
  const mode = usePurchaseMode();
  const { user } = useAuth();

  const { data: product, isLoading, isError } = useProduct(productSlug || "");
  const { data: pricing } = useProductPricing(productSlug || "");
  const { data: related } = useRelatedProducts(productSlug || "");

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

  const basePrice = Number(product.base_price) || 0;

  const showCompanyPrice =
    mode === "COMPANY" &&
    !!user?.company_id &&
    !!pricing &&
    Number(pricing.company_discount_percentage) > 0;

  const displayPrice = showCompanyPrice
    ? Number(pricing!.unit_price)
    : basePrice;

  const isDescriptionLong =
    product.description && product.description.length > 150;

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-8 pt-10 lg:pt-14 pb-12 flex flex-col gap-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-center">
        <div className="bg-bg-surface border border-border-base/20 rounded-2xl p-6 sticky top-4 w-full shadow-[0_4px_24px_rgba(38,84,124,0.10)]">
          <ProductImage
            src={product.main_image_url}
            alt={product.name || "Product image"}
            className="rounded-xl"
          />
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

          {/* Price & Stock */}
          <div className="flex flex-col gap-2 bg-bg-base p-4 rounded-xl border border-border-base/20 shadow-sm">
            {showCompanyPrice ? (
              <div className="flex flex-col gap-0.5">
                <span className="text-sm text-text-muted line-through font-mono">
                  ${basePrice.toFixed(2)}
                </span>
                <span className="text-3xl font-bold text-accent font-mono">
                  ${displayPrice.toFixed(2)}
                </span>
                <span className="text-xs text-green-600 font-medium">
                  Company discount: -{Number(pricing!.company_discount_percentage).toFixed(0)}%
                </span>
              </div>
            ) : (
              <div className="text-3xl font-bold text-text-primary font-mono">
                ${displayPrice.toFixed(2)}
              </div>
            )}

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

          {product.is_active && (
            <AddToCart
              productId={product.id}
              stock={product.stock_quantity}
              isB2bOnly={product.is_b2b_only}
            />
          )}
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
        <VolumeDiscounts tiers={pricing?.tiers ?? []} />
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

      <ProductRail title="Similar products" products={related ?? []} />
    </div>
  );
}
