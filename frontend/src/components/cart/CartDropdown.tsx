import { ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { useCartActions } from "../../hooks/cart/useCartActions";
import { useCartView } from "../../hooks/cart/useCartView";
import CartLineItem from "./CartLineItem";

interface CartDropdownProps {
  onClose: () => void;
}

export default function CartDropdown({ onClose }: CartDropdownProps) {
  const { lines, availableSubtotal, isLoading, isError } = useCartView();
  const { setQty, remove, pendingProductIds } = useCartActions();

  return (
    <div className="absolute left-1/2 -translate-x-1/2  top-full mt-5 w-100 bg-bg-surface border border-border-base/20 rounded-2xl shadow-xl z-50 flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-border-base/10">
        <h2 className="text-sm font-semibold text-text-main">Your cart</h2>
      </div>

      <div className="overflow-y-auto max-h-72 px-4 divide-y divide-border-base/10">
        {isLoading && (
          <div className="py-6 text-center text-sm text-text-muted">
            Loading cart…
          </div>
        )}
        {isError && (
          <div className="py-6 text-center text-sm text-red-500">
            Failed to load cart
          </div>
        )}
        {!isLoading && !isError && lines.length === 0 && (
          <div className="py-8 flex flex-col items-center gap-3 text-text-muted">
            <ShoppingBag size={32} strokeWidth={1.5} />
            <p className="text-sm">Your cart is empty</p>
            <Link
              to="/catalog"
              onClick={onClose}
              className="text-xs text-accent hover:underline"
            >
              Back to shop
            </Link>
          </div>
        )}
        {!isLoading &&
          lines.map((line) => (
            <CartLineItem
              key={line.product_id}
              line={line}
              onSetQty={setQty}
              onRemove={remove}
              isPending={pendingProductIds.has(line.product_id)}
            />
          ))}
      </div>

      {!isLoading && lines.length > 0 && (
        <div className="px-4 py-3 border-t border-border-base/10 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Subtotal</span>
            <span className="font-semibold text-text-main">
              ${availableSubtotal.toFixed(2)}
            </span>
          </div>
          <div className="flex gap-2">
            <Link
              to="/cart"
              onClick={onClose}
              className="flex-1 text-center py-2 text-sm border border-border-base/40 rounded-lg hover:border-accent hover:text-accent transition-colors"
            >
              View cart
            </Link>
            <button
              disabled
              className="flex-1 py-2 text-sm bg-primary text-white rounded-lg opacity-40 cursor-not-allowed"
            >
              Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
