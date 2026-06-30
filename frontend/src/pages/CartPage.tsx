import { ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import CartLineItem from "../components/cart/CartLineItem";
import { useCartActions } from "../hooks/cart/useCartActions";
import { useCartView } from "../hooks/cart/useCartView";
import { useCartQuote } from "../hooks/pricing/useCartQuote";

export default function CartPage() {
  const { lines, quoteItems, isLoading, isError } = useCartView();
  const { setQty, remove, toggleSelect, pendingProductIds } = useCartActions();
  const { data: quote } = useCartQuote(quoteItems);

  const pricingMap = new Map(quote?.lines.map((l) => [l.product_id, l]));

  const selectedLines = lines.filter((l) => l.available && l.selected);
  const selectedCount = selectedLines.length;

  // Compute summary breakdown from selected lines
  const subtotalBase = selectedLines.reduce((sum, l) => {
    const pl = pricingMap.get(l.product_id);
    return (
      sum +
      (pl ? Number(pl.base_price) * pl.quantity : l.base_price * l.quantity)
    );
  }, 0);

  const companyDiscountAmt = selectedLines.reduce((sum, l) => {
    const pl = pricingMap.get(l.product_id);
    if (!pl || Number(pl.company_pct) === 0) return sum;
    return (
      sum +
      (Number(pl.base_price) - Number(pl.price_after_company)) * pl.quantity
    );
  }, 0);

  const volumeDiscountAmt = selectedLines.reduce((sum, l) => {
    const pl = pricingMap.get(l.product_id);
    if (!pl || Number(pl.volume_pct) === 0) return sum;
    return (
      sum +
      (Number(pl.price_after_company) - Number(pl.final_unit_price)) *
        pl.quantity
    );
  }, 0);

  const grandTotal = selectedLines.reduce((sum, l) => {
    const pl = pricingMap.get(l.product_id);
    return sum + (pl ? Number(pl.line_total) : l.base_price * l.quantity);
  }, 0);

  const totalSavings = companyDiscountAmt + volumeDiscountAmt;

  // Company discount % for the summary label — take from any selected line that has one
  const companyPctDisplay = selectedLines.reduce((pct, l) => {
    const pl = pricingMap.get(l.product_id);
    return pl && Number(pl.company_pct) > 0 ? Number(pl.company_pct) : pct;
  }, 0);

  const hasQuote = !!quote && selectedCount > 0;

  return (
    // Zastosowanie max-w-[1600px] analogicznie jak w katalogu
    <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-8">
      {/* Oddzielająca kreseczka pod nagłówkiem */}
      <div className="pb-6 mb-8 border-b border-border-base/20">
        <h1 className="text-3xl font-bold text-text-main">Shopping Cart</h1>
      </div>

      {isLoading && (
        <div className="text-center py-16 text-text-muted">Loading cart…</div>
      )}

      {isError && (
        <div className="text-center py-16 text-red-500">
          Failed to load cart
        </div>
      )}

      {!isLoading && !isError && lines.length === 0 && (
        <div className="flex flex-col items-center gap-5 py-24 text-text-muted">
          <ShoppingBag size={56} strokeWidth={1.5} />
          <p className="text-xl font-medium">Your cart is empty</p>
          <Link
            to="/catalog"
            className="mt-4 px-8 py-3 bg-primary text-white rounded-lg hover:bg-accent transition-colors text-sm font-semibold shadow-sm"
          >
            Back to shop
          </Link>
        </div>
      )}

      {!isLoading && lines.length > 0 && (
        // Zwiększony gap-8 dla zachowania proporcji na szerokim ekranie
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
          {/* ── Left: cart items ── */}
          <div className="bg-bg-surface border border-border-base/20 rounded-2xl overflow-hidden shadow-sm">
            <div className="divide-y divide-border-base/10 px-8">
              {lines.map((line) => (
                <CartLineItem
                  key={line.product_id}
                  line={line}
                  pricingLine={pricingMap.get(line.product_id) ?? null}
                  showCheckbox
                  onSetQty={setQty}
                  onRemove={remove}
                  onToggleSelect={toggleSelect}
                  isPending={pendingProductIds.has(line.product_id)}
                />
              ))}
            </div>
          </div>

          {/* ── Right: summary panel ── */}
          <div className="bg-bg-surface border border-border-base/20 rounded-2xl p-7 space-y-5 lg:sticky lg:top-24 shadow-sm">
            <h2 className="text-lg font-bold text-text-main">Summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">
                  Subtotal ({selectedCount}{" "}
                  {selectedCount === 1 ? "item" : "items"})
                </span>
                <span className="font-mono text-text-main">
                  ${subtotalBase.toFixed(2)}
                </span>
              </div>

              {hasQuote && companyDiscountAmt > 0 && (
                <div className="flex justify-between text-accent">
                  <span>
                    Company Discount
                    {companyPctDisplay > 0 &&
                      ` (${companyPctDisplay.toFixed(0)}%)`}
                  </span>
                  <span className="font-mono">
                    −${companyDiscountAmt.toFixed(2)}
                  </span>
                </div>
              )}

              {hasQuote && volumeDiscountAmt > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Volume Discount</span>
                  <span className="font-mono">
                    −${volumeDiscountAmt.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {hasQuote && totalSavings > 0 && (
              <>
                <div className="border-t border-border-base/10 pt-4 flex justify-between text-sm font-medium text-text-muted">
                  <span>Total Savings</span>
                  <span className="font-mono">−${totalSavings.toFixed(2)}</span>
                </div>
                <div className="border-t border-border-base/10 pt-4 flex justify-between items-baseline">
                  <span className="text-lg font-bold text-text-main">
                    Grand Total
                  </span>
                  <span className="text-2xl font-bold text-text-main font-mono">
                    ${grandTotal.toFixed(2)}
                  </span>
                </div>
              </>
            )}

            {(!hasQuote || totalSavings === 0) && (
              <div className="border-t border-border-base/10 pt-4 flex justify-between items-baseline">
                <span className="text-lg font-bold text-text-main">
                  Grand Total
                </span>
                <span className="text-2xl font-bold text-text-main font-mono">
                  ${(hasQuote ? grandTotal : subtotalBase).toFixed(2)}
                </span>
              </div>
            )}

            <div className="pt-2">
              <button
                disabled
                className="w-full py-3.5 bg-primary text-white rounded-lg font-semibold opacity-40 cursor-not-allowed text-base transition-opacity shadow-sm"
              >
                Proceed to Checkout
              </button>
              <p className="text-xs text-text-muted text-center mt-3">
                Checkout coming soon
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
