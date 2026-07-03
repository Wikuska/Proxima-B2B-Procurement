import { Navigate, useNavigate, useOutletContext } from "react-router-dom";
import type { CheckoutContext } from "../checkoutTypes";

export default function ReviewStep() {
  const navigate = useNavigate();
  const {
    canProceedToDocument,
    isBillingComplete,
    selectedLines,
    quote,
    grandTotal,
    isCompanyMode,
    billing,
    selectedAddress,
    inlineAddress,
    handlePlaceOrder,
    isPlacingOrder,
  } = useOutletContext<CheckoutContext>();

  if (!canProceedToDocument) {
    return <Navigate to="/checkout/shipping" replace />;
  }
  if (!isBillingComplete) {
    return <Navigate to="/checkout/document" replace />;
  }

  return (
    <div className="space-y-6">
      <section className="bg-bg-surface border border-border-base/20 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-text-main mb-4">Items</h2>
        <div className="divide-y divide-border-base/10">
          {selectedLines.map((l) => {
            const priceLine = quote?.lines.find(
              (ql) => ql.product_id === l.product_id,
            );
            return (
              <div
                key={l.product_id}
                className="py-3 flex justify-between items-center gap-4"
              >
                <div>
                  <p className="text-sm font-medium text-text-main">
                    {l.name}
                  </p>
                  <p className="text-xs text-text-muted">
                    {l.sku} · qty {l.quantity}
                  </p>
                </div>
                <p className="text-sm font-semibold text-text-main font-mono whitespace-nowrap">
                  $
                  {priceLine
                    ? Number(priceLine.line_total).toFixed(2)
                    : (l.base_price * l.quantity).toFixed(2)}
                </p>
              </div>
            );
          })}
        </div>
        {grandTotal !== null && (
          <div className="border-t border-border-base/10 mt-4 pt-4 flex justify-between items-baseline">
            <span className="text-sm font-bold text-text-main">Total</span>
            <span className="text-xl font-bold text-text-main font-mono">
              ${grandTotal.toFixed(2)}
            </span>
          </div>
        )}
      </section>

      <section className="bg-bg-surface border border-border-base/20 rounded-2xl p-6 shadow-sm space-y-3">
        <h2 className="text-base font-semibold text-text-main">
          Delivery & Document
        </h2>
        <div className="text-sm text-text-muted space-y-1">
          <p>
            <span className="font-medium text-text-main">Document:</span>{" "}
            {isCompanyMode
              ? "Company Invoice (B2B)"
              : billing.documentType === "RECEIPT"
                ? "Receipt"
                : billing.documentType === "PERSONAL_INVOICE"
                  ? "Personal Invoice"
                  : "Company Invoice (manual)"}
          </p>
          {selectedAddress && (
            <p>
              <span className="font-medium text-text-main">Ship to:</span>{" "}
              {selectedAddress.street}, {selectedAddress.city}{" "}
              {selectedAddress.postal_code}, {selectedAddress.country}
            </p>
          )}
          {inlineAddress && (
            <p>
              <span className="font-medium text-text-main">Ship to:</span>{" "}
              {inlineAddress.street}, {inlineAddress.city}{" "}
              {inlineAddress.postal_code}, {inlineAddress.country}
            </p>
          )}
        </div>
      </section>

      <div className="flex gap-3">
        <button
          onClick={() => navigate("/checkout/document")}
          className="flex-1 py-3.5 border border-border-base text-text-muted rounded-lg font-semibold text-sm hover:text-primary hover:border-primary transition-colors"
        >
          Back
        </button>
        <button
          onClick={handlePlaceOrder}
          disabled={isPlacingOrder}
          className="flex-1 py-3.5 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-accent transition-colors disabled:opacity-60 shadow-sm"
        >
          {isPlacingOrder ? "Placing order…" : "Place Order"}
        </button>
      </div>
    </div>
  );
}
