import { ShoppingBag } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/user/useAuth";
import { useCartActions } from "../../hooks/cart/useCartActions";
import { useCartView } from "../../hooks/cart/useCartView";
import { useCartQuote } from "../../hooks/pricing/useCartQuote";
import { usePurchaseMode } from "../../store/purchaseModeStore";
import { canProceedToCheckout } from "../../utils/canProceedToCheckout";
import CartLineItem from "./CartLineItem";
import { openAuth } from "../../utils/openAuth";

interface CartDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDropdown({ isOpen, onClose }: CartDropdownProps) {
  const { isAuthenticated, user } = useAuth();
  const purchaseMode = usePurchaseMode();
  const navigate = useNavigate();
  const location = useLocation();
  const { lines, quoteItems, availableSubtotal, isLoading, isError } =
    useCartView();
  const { setQty, remove, pendingProductIds } = useCartActions();
  const { data: quote } = useCartQuote(quoteItems);

  const pricingMap = new Map(quote?.lines.map((l) => [l.product_id, l]));

  const selectedLines = lines.filter((l) => l.available && l.selected);
  const checkoutGate = canProceedToCheckout(
    selectedLines,
    purchaseMode,
    user?.company_id,
  );

  const availableLines = lines.filter((l) => l.available);
  const pricedSubtotal = quote
    ? availableLines.reduce((sum, l) => {
        const pl = pricingMap.get(l.product_id);
        return sum + (pl ? Number(pl.line_total) : l.base_price * l.quantity);
      }, 0)
    : availableSubtotal;

  return (
    <div
      className={`absolute left-1/2 -translate-x-1/2 top-full mt-5 w-[480px] bg-bg-surface border border-border-base/30 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden origin-top ${
        isOpen ? "animate-pop-down" : "animate-pop-up"
      }`}
    >
      <div className="px-5 py-4 border-b border-border-base/10 flex justify-between items-center bg-bg-surface">
        <h2 className="text-base font-bold text-text-main">Your cart</h2>
        {!isLoading && lines.length > 0 && (
          <span className="text-xs font-medium text-text-muted bg-bg-base px-2 py-1 rounded-md">
            {lines.length} {lines.length === 1 ? "item" : "items"}
          </span>
        )}
      </div>
      <div
        className="overflow-y-auto max-h-[22rem] px-5 divide-y divide-border-base/10 
        [&::-webkit-scrollbar]:w-1.5 
        [&::-webkit-scrollbar-track]:bg-transparent 
        [&::-webkit-scrollbar-thumb]:bg-border-base/30 
        [&::-webkit-scrollbar-thumb]:rounded-full 
        hover:[&::-webkit-scrollbar-thumb]:bg-border-base/50
        transition-colors"
      >
        {isLoading && (
          <div className="py-8 text-center text-sm text-text-muted">
            Loading cart…
          </div>
        )}
        {isError && (
          <div className="py-8 text-center text-sm text-red-500">
            Failed to load cart
          </div>
        )}
        {!isLoading && !isError && lines.length === 0 && (
          <div className="py-12 flex flex-col items-center gap-3 text-text-muted">
            <ShoppingBag
              size={40}
              strokeWidth={1.5}
              className="text-border-base"
            />
            <p className="text-sm font-medium">Your cart is empty</p>
            <Link
              to="/catalog"
              onClick={onClose}
              className="text-sm text-accent hover:underline mt-1"
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
              pricingLine={pricingMap.get(line.product_id) ?? null}
              compact
              onSetQty={setQty}
              onRemove={remove}
              isPending={pendingProductIds.has(line.product_id)}
            />
          ))}
      </div>

      {!isLoading && lines.length > 0 && (
        <div className="px-5 py-5 border-t border-border-base/20 space-y-4 bg-bg-base/50">
          <div className="flex justify-between items-baseline text-sm">
            <span className="text-text-muted font-medium">Subtotal</span>
            <span className="font-bold text-text-main text-lg font-mono">
              ${pricedSubtotal.toFixed(2)}
            </span>
          </div>
          <div className="flex gap-3">
            <Link
              to="/cart"
              onClick={onClose}
              className="flex-1 text-center py-2.5 text-sm font-semibold border border-border-base/40 rounded-xl hover:border-accent hover:text-accent bg-bg-surface transition-colors shadow-sm"
            >
              View cart
            </Link>
            <button
              disabled={!checkoutGate.ok}
              onClick={() => {
                onClose();
                if (!isAuthenticated) {
                  openAuth(navigate, location, { from: "/checkout" });
                } else if (checkoutGate.ok) {
                  navigate("/checkout");
                }
              }}
              className="flex-1 py-2.5 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-accent transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
