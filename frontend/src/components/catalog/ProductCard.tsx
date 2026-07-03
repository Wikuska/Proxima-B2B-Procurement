import { ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { type ProductListOut } from "../../api/catalog";
import { useCartActions } from "../../hooks/cart/useCartActions";
import { useAuth } from "../../hooks/user/useAuth";
import { usePurchaseMode } from "../../store/purchaseModeStore";
import ProductImage from "../product/ProductImage";

interface ProductCardProps {
  product: ProductListOut;
}

export default function ProductCard({ product }: ProductCardProps) {
  const {
    id,
    name,
    slug,
    sku,
    base_price,
    is_b2b_only,
    main_image_url,
    stock_quantity,
    company_discount_percentage,
    company_unit_price,
  } = product;
  const { user } = useAuth();
  const mode = usePurchaseMode();
  const { add, pendingProductIds } = useCartActions();
  const isPending = pendingProductIds.has(id);

  const showCompanyPrice =
    mode === "COMPANY" &&
    !!user?.company_id &&
    !!company_unit_price &&
    Number(company_discount_percentage) > 0;

  const b2bBlocked = is_b2b_only && !(!!user?.company_id && mode === "COMPANY");

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (b2bBlocked) {
      toast.error("Available to company accounts only");
      return;
    }
    if (stock_quantity <= 0) {
      toast.error("Out of stock");
      return;
    }
    add(id, 1);
  };

  return (
    <div className="group flex flex-col h-full bg-bg-surface border border-border-base/20 rounded-2xl overflow-hidden hover:shadow-xl hover:border-accent/30 transition-all duration-300">
      <Link
        to={`/product/${slug}`}
        className="relative bg-white p-4 border-b border-border-base/10 block overflow-hidden"
      >
        <div className="group-hover:scale-105 transition-transform duration-500">
          <ProductImage src={main_image_url} alt={`Photo of ${name}`} />
        </div>

        {is_b2b_only && (
          <span className="absolute top-5 right-5 bg-accent/10 text-accent text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
            B2B Only
          </span>
        )}
      </Link>

      <div className="p-5 flex flex-col flex-grow">
        <span className="text-[11px] text-text-muted font-mono mb-1">{sku}</span>

        <Link
          to={`/product/${slug}`}
          className="font-medium text-text-main text-sm leading-snug mb-4 line-clamp-2 group-hover:text-accent transition-colors"
        >
          {name}
        </Link>

        <div className="mt-auto flex flex-col gap-3">
          <div className="flex flex-col">
            {showCompanyPrice ? (
              <>
                <span className="text-xs text-text-muted line-through font-mono">
                  ${Number(base_price).toFixed(2)}
                </span>
                <span className="text-lg font-bold text-accent">
                  ${Number(company_unit_price).toFixed(2)}
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-text-main">
                ${Number(base_price).toFixed(2)}
              </span>
            )}
          </div>
          <button
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-accent text-white text-sm font-medium py-2.5 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={isPending || b2bBlocked || stock_quantity <= 0}
            onClick={handleQuickAdd}
          >
            <ShoppingCart size={16} />
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
