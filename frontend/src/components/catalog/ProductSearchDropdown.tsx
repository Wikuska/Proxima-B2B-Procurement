import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import type { ProductListOut } from "../../api/catalog";
import { useAuth } from "../../hooks/user/useAuth";
import { usePurchaseMode } from "../../store/purchaseModeStore";
import ProductImage from "../product/ProductImage";

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
    <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-bg-surface border border-border-base/30 rounded-xl shadow-xl overflow-hidden">
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
        <ul className="max-h-80 overflow-y-auto divide-y divide-border-base/10">
          {items.map((product) => {
            const showCompanyPrice =
              mode === "COMPANY" &&
              !!user?.company_id &&
              !!product.company_unit_price &&
              Number(product.company_discount_percentage) > 0;

            return (
              <li key={product.id}>
                <Link
                  to={`/product/${product.slug}`}
                  onClick={onSelectProduct}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-bg-base transition-colors"
                >
                  <div className="w-12 h-12 shrink-0">
                    <ProductImage
                      src={product.main_image_url}
                      alt={product.name}
                      compact
                      className="rounded-md"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-main truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-text-muted font-mono">
                      {product.sku}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {showCompanyPrice ? (
                      <span className="text-sm font-bold text-accent">
                        ${Number(product.company_unit_price).toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-sm font-bold text-text-main">
                        ${Number(product.base_price).toFixed(2)}
                      </span>
                    )}
                    {product.is_b2b_only && (
                      <span className="block text-[10px] font-bold text-accent uppercase mt-0.5">
                        B2B
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={onSeeAll}
        className="w-full px-4 py-3 text-sm font-medium text-accent hover:bg-accent/5 border-t border-border-base/20 transition-colors text-left"
      >
        See all results for &ldquo;{query}&rdquo;
      </button>
    </div>
  );
}
