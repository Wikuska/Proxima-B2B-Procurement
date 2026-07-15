import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import type { ProductListOut } from "../../api/catalog";
import { useAuth } from "../../hooks/user/useAuth";
import { usePurchaseMode } from "../../store/purchaseModeStore";
import ProductImage from "../product/ProductImage";

const SCROLL_AREA_CLASS =
  "scrollbar-none overflow-y-auto overscroll-contain scroll-smooth max-h-[min(32rem,calc(100dvh-8rem))] px-4 divide-y divide-border-base/10 bg-bg-surface";

interface ProductSearchDropdownProps {
  query: string;
  items: ProductListOut[];
  isLoading: boolean;
  onSelectProduct: () => void;
  onSeeAll: () => void;
}

export default function ProductSearchDropdown({
  query,
  items,
  isLoading,
  onSelectProduct,
  onSeeAll,
}: ProductSearchDropdownProps) {
  const { user } = useAuth();
  const mode = usePurchaseMode();

  return (
    <div className="absolute left-0 right-0 top-full mt-4 z-50 bg-bg-surface border border-border-base/30 rounded-xl shadow-xl overflow-hidden animate-pop-down origin-top">
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-text-muted">
          <Loader2 size={16} className="animate-spin" />
          Searching...
        </div>
      ) : items.length === 0 ? (
        <div className="py-8 text-center text-sm text-text-muted">
          No products found
        </div>
      ) : (
        <div className="relative">
          <div className={SCROLL_AREA_CLASS}>
            {items.map((product) => {
            const showCompanyPrice =
              mode === "COMPANY" &&
              !!user?.company_id &&
              !!product.company_unit_price &&
              Number(product.company_discount_percentage) > 0;

            return (
              <Link
                key={product.id}
                to={`/product/${product.slug}`}
                onClick={onSelectProduct}
                className="group flex items-center gap-3 py-3 transition-colors hover:bg-bg-base/60"
              >
                <ProductImage
                  src={product.main_image_url}
                  alt={product.name}
                  compact
                  className="w-12 shrink-0"
                />
                <div className="flex flex-1 min-w-0 items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-main group-hover:text-accent truncate transition-colors">
                      {product.name}
                    </p>
                    <p className="text-xs text-text-muted font-mono mt-0.5">
                      {product.sku}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {showCompanyPrice ? (
                      <span className="text-sm font-semibold text-accent font-mono">
                        ${Number(product.company_unit_price).toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-sm font-semibold text-text-main font-mono">
                        ${Number(product.base_price).toFixed(2)}
                      </span>
                    )}
                    {product.is_b2b_only && (
                      <span className="block text-[10px] font-bold text-accent uppercase mt-0.5">
                        B2B
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
          </div>

          {items.length >= 5 && (
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-bg-surface via-bg-surface/80 to-transparent"
              aria-hidden
            />
          )}
        </div>
      )}

      <div className="px-4 py-2 border-t border-border-base/20 bg-bg-surface">
        <button
          type="button"
          onClick={onSeeAll}
          className="group relative flex w-full items-center justify-between gap-2 px-3 py-2 rounded-lg bg-accent/5 border border-accent/20 hover:border-accent/50 hover:bg-white hover:shadow-sm transition-all duration-300 overflow-hidden text-left"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent scale-y-100 origin-top" />

          <span className="min-w-0 flex-1 text-sm font-bold text-text-main group-hover:text-accent transition-colors truncate">
            See all results for &ldquo;{query}&rdquo;
          </span>

          <span className="shrink-0 text-accent opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 font-bold text-base">
            →
          </span>
        </button>
      </div>
    </div>
  );
}
