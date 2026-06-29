import { ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { type ProductListOut } from "../../api/catalog";
import { useCartActions } from "../../hooks/cart/useCartActions";
import { useAuth } from "../../hooks/user/useAuth";

interface ProductCardProps {
  product: ProductListOut;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { id, name, slug, sku, base_price, is_b2b_only, main_image_url, stock_quantity } =
    product;
  const { user } = useAuth();
  const { add, pendingProductIds } = useCartActions();
  const isPending = pendingProductIds.has(id);
  const b2bBlocked = is_b2b_only && !user?.company_id;

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
    <div className="group flex flex-col bg-bg-surface border border-border-base/20 rounded-2xl overflow-hidden hover:shadow-xl hover:border-accent/30 transition-all duration-300">
      <Link
        to={`/product/${slug}`}
        className="relative aspect-square bg-white p-4 flex items-center justify-center border-b border-border-base/10 block overflow-hidden"
      >
        <div className="w-40 h-40 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
          {main_image_url ? (
            <img
              src={main_image_url}
              alt={`Photo of ${name}`}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
              No Image
            </div>
          )}
        </div>

        {is_b2b_only && (
          <span className="absolute top-3 left-3 bg-gray-800 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
            B2B Only
          </span>
        )}
      </Link>

      <div className="p-5 flex flex-col flex-1">
        <span className="text-[11px] text-text-muted font-mono mb-1">
          {sku}
        </span>

        <Link
          to={`/product/${slug}`}
          className="font-medium text-text-main text-sm leading-snug mb-4 group-hover:text-accent transition-colors"
        >
          {name}
        </Link>

        <div className="mt-auto flex items-center justify-between">
          <span className="text-lg font-bold text-text-main">
            ${Number(base_price).toFixed(2)}
          </span>
          <button
            className="bg-bg-base border border-border-base hover:border-accent hover:bg-accent hover:text-white text-text-main p-2 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Add to cart"
            disabled={isPending || b2bBlocked || stock_quantity <= 0}
            onClick={handleQuickAdd}
          >
            <ShoppingCart size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
