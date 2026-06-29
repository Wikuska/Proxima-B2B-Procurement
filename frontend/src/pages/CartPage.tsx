import { ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import CartLineItem from "../components/cart/CartLineItem";
import { useCartActions } from "../hooks/cart/useCartActions";
import { useCartView } from "../hooks/cart/useCartView";

export default function CartPage() {
  const { lines, selectedSubtotal, isLoading, isError } = useCartView();
  const { setQty, remove, toggleSelect, pendingProductIds } = useCartActions();

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-text-main mb-8">Shopping Cart</h1>

      {isLoading && (
        <div className="text-center py-16 text-text-muted">Loading cart…</div>
      )}

      {isError && (
        <div className="text-center py-16 text-red-500">Failed to load cart</div>
      )}

      {!isLoading && !isError && lines.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-16 text-text-muted">
          <ShoppingBag size={48} strokeWidth={1.5} />
          <p className="text-lg">Your cart is empty</p>
          <Link
            to="/catalog"
            className="mt-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-accent transition-colors text-sm font-medium"
          >
            Back to shop
          </Link>
        </div>
      )}

      {!isLoading && lines.length > 0 && (
        <div className="bg-bg-surface border border-border-base/20 rounded-2xl overflow-hidden">
          <div className="divide-y divide-border-base/10 px-6">
            {lines.map((line) => (
              <CartLineItem
                key={line.product_id}
                line={line}
                showCheckbox
                onSetQty={setQty}
                onRemove={remove}
                onToggleSelect={toggleSelect}
                isPending={pendingProductIds.has(line.product_id)}
              />
            ))}
          </div>

          <div className="px-6 py-4 border-t border-border-base/10 flex items-center justify-between">
            <div className="text-sm text-text-muted">
              Subtotal (selected &amp; available)
            </div>
            <div className="text-xl font-bold text-text-main">
              ${selectedSubtotal.toFixed(2)}
            </div>
          </div>

          <div className="px-6 pb-5">
            <button
              disabled
              className="w-full py-3 bg-primary text-white rounded-lg font-semibold opacity-40 cursor-not-allowed"
            >
              Proceed to Checkout
            </button>
            <p className="text-xs text-text-muted text-center mt-2">
              Checkout coming soon
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
