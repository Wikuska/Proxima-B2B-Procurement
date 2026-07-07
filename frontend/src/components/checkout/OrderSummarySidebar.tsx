import type { QuoteOut } from "../../api/pricing";
import type { CartLineItem } from "../../hooks/cart/useCartView";
import ProductImage from "../product/ProductImage";

interface OrderSummarySidebarProps {
  lines: CartLineItem[];
  quote: QuoteOut | undefined;
  /** null → delivery method not yet confirmed, shown as a dash. */
  shippingCost: number | null;
  nextLabel: string;
  onNext: () => void;
  nextDisabled?: boolean;
  onBack?: () => void;
}

export default function OrderSummarySidebar({
  lines,
  quote,
  shippingCost,
  nextLabel,
  onNext,
  nextDisabled,
  onBack,
}: OrderSummarySidebarProps) {
  const pricingMap = new Map(quote?.lines.map((l) => [l.product_id, l]));
  const subtotal = quote
    ? Number(quote.subtotal_base)
    : lines.reduce((sum, l) => sum + l.base_price * l.quantity, 0);
  const discount = quote ? Number(quote.total_discount) : 0;
  const grandTotal = quote ? Number(quote.grand_total) : subtotal;
  const total = grandTotal + (shippingCost ?? 0);

  return (
    <aside className="bg-bg-surface border border-border-base/20 rounded-2xl shadow-sm overflow-hidden lg:sticky lg:top-24">
      <div className="px-5 py-4 border-b border-border-base/10 flex justify-between items-center">
        <h2 className="text-base font-bold text-text-main">Order summary</h2>
        <span className="text-xs font-medium text-text-muted bg-bg-base px-2 py-1 rounded-md">
          {lines.length} {lines.length === 1 ? "item" : "items"}
        </span>
      </div>

      <div
        className="overflow-y-auto max-h-72 px-5 divide-y divide-border-base/10
        [&::-webkit-scrollbar]:w-1.5
        [&::-webkit-scrollbar-track]:bg-transparent
        [&::-webkit-scrollbar-thumb]:bg-border-base/30
        [&::-webkit-scrollbar-thumb]:rounded-full
        hover:[&::-webkit-scrollbar-thumb]:bg-border-base/50
        transition-colors"
      >
        {lines.map((l) => {
          const priceLine = pricingMap.get(l.product_id);
          const lineTotal = priceLine
            ? Number(priceLine.line_total)
            : l.base_price * l.quantity;
          return (
            <div key={l.product_id} className="flex gap-3 py-3">
              <ProductImage
                src={l.main_image_url}
                alt={l.name}
                compact
                className="w-12 shrink-0"
              />
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <p className="text-sm font-medium text-text-main truncate">
                  {l.name}
                </p>
                <p className="text-xs text-text-muted">qty {l.quantity}</p>
              </div>
              <p className="text-sm font-semibold text-text-main font-mono whitespace-nowrap self-center">
                ${lineTotal.toFixed(2)}
              </p>
            </div>
          );
        })}
      </div>

      <div className="px-5 py-4 border-t border-border-base/10 space-y-1.5 bg-bg-base/50">
        <div className="flex justify-between text-sm text-text-muted">
          <span>Subtotal</span>
          <span className="font-mono">${subtotal.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount</span>
            <span className="font-mono">−${discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm text-text-muted">
          <span>Shipping</span>
          <span className="font-mono">
            {shippingCost === null
              ? "—"
              : shippingCost === 0
                ? "Free"
                : `$${shippingCost.toFixed(2)}`}
          </span>
        </div>
        <div className="flex justify-between items-baseline pt-2 mt-1 border-t border-border-base/10">
          <span className="text-sm font-bold text-text-main">Total</span>
          <span className="text-lg font-bold text-text-main font-mono">
            ${total.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="px-5 pb-5 pt-1 space-y-2">
        <button
          onClick={onNext}
          disabled={nextDisabled}
          className="w-full py-3 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
        >
          {nextLabel}
        </button>
        {onBack && (
          <button
            onClick={onBack}
            className="w-full py-3 border border-border-base text-text-muted rounded-lg font-semibold text-sm hover:text-primary hover:border-primary transition-colors"
          >
            Go back
          </button>
        )}
      </div>
    </aside>
  );
}
