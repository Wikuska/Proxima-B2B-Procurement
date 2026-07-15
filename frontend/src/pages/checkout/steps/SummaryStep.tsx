import { useFormContext } from "react-hook-form";
import { Navigate, useNavigate, useOutletContext } from "react-router-dom";
import { DELIVERY_LABELS, PAYMENT_LABELS } from "../../../api/order";
import type { DetailsFormData } from "../../../schemas/checkoutSchema";
import type { CheckoutContext } from "../checkoutTypes";

function SummaryField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="text-sm text-text-main">{children}</p>
    </div>
  );
}

export default function SummaryStep() {
  const navigate = useNavigate();
  const {
    canProceedToDelivery,
    canProceedToSummary,
    selectedLines,
    quote,
    grandTotal,
    shippingCost,
    orderTotal,
    isCompanyMode,
    selectedAddress,
    inlineAddress,
    deliveryMethod,
    paymentMethod,
    note,
    setNote,
    handlePlaceOrder,
    isPlacingOrder,
  } = useOutletContext<CheckoutContext>();

  const { watch } = useFormContext<DetailsFormData>();
  const recipient = watch("recipient");
  const billing = watch("billing");

  if (!canProceedToDelivery) {
    return <Navigate to="/checkout/details" replace />;
  }
  if (!canProceedToSummary) {
    return <Navigate to="/checkout/delivery" replace />;
  }

  const shipToAddress = selectedAddress ?? inlineAddress;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="space-y-6 min-w-0">
        <section className="bg-bg-surface border border-border-base/20 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-text-main mb-4">Items</h2>
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
            <div className="border-t border-border-base/10 mt-4 pt-3 space-y-1.5">
              <div className="flex justify-between text-sm text-text-muted">
                <span>Subtotal</span>
                <span className="font-mono">${grandTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-text-muted">
                <span>Shipping ({DELIVERY_LABELS[deliveryMethod]})</span>
                <span className="font-mono">
                  {shippingCost === 0 ? "Free" : `$${shippingCost.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between items-baseline pt-1.5 border-t border-border-base/10">
                <span className="text-sm font-bold text-text-main">Total</span>
                <span className="text-xl font-bold text-text-main font-mono">
                  ${(orderTotal ?? grandTotal).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </section>

        <section className="bg-bg-surface border border-border-base/20 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-xl font-bold text-text-main">
            Delivery & Payment
          </h2>
          <SummaryField label="Document">
            {isCompanyMode
              ? "Company Invoice (B2B)"
              : billing.documentType === "RECEIPT"
                ? "Receipt"
                : billing.documentType === "PERSONAL_INVOICE"
                  ? "Personal Invoice"
                  : "Company Invoice (manual)"}
          </SummaryField>

          {shipToAddress && (
            <SummaryField label="Ship to">
              {shipToAddress.street}, {shipToAddress.city}{" "}
              {shipToAddress.postal_code}, {shipToAddress.country}
            </SummaryField>
          )}

          <SummaryField label="Recipient">
            {recipient.recipient_name} · {recipient.recipient_phone}
            {recipient.recipient_email && <> · {recipient.recipient_email}</>}
          </SummaryField>

          <SummaryField label="Delivery method">
            {DELIVERY_LABELS[deliveryMethod]}
          </SummaryField>

          <SummaryField label="Payment method">
            {PAYMENT_LABELS[paymentMethod]}
          </SummaryField>
        </section>

        <section className="bg-bg-surface border border-border-base/20 rounded-2xl p-6 shadow-sm space-y-3">
          <h2 className="text-xl font-bold text-text-main">
            Order note{" "}
            <span className="font-normal text-text-muted">(optional)</span>
          </h2>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Anything we should know about your order? (e.g. delivery instructions)"
            rows={3}
            className="w-full px-3 py-2 text-sm border border-border-base rounded-lg focus:outline-none focus:border-primary bg-bg-surface text-text-main resize-none"
          />
        </section>
      </div>

      <aside className="bg-bg-surface border border-border-base/20 rounded-2xl p-7 space-y-4 lg:sticky lg:top-24 shadow-sm">
        <h2 className="text-lg font-bold text-text-main">Ready to order?</h2>
        <p className="text-sm text-text-muted">
          Review the details on the left, then place your order.
        </p>
        <div className="space-y-2 pt-2">
          <button
            onClick={handlePlaceOrder}
            disabled={isPlacingOrder}
            className="w-full py-3.5 bg-primary text-white rounded-lg font-semibold text-base hover:bg-accent transition-colors disabled:opacity-60 shadow-sm"
          >
            {isPlacingOrder ? "Placing order…" : "Place Order"}
          </button>
          <button
            onClick={() => navigate("/checkout/delivery")}
            className="w-full py-3.5 border border-border-base text-text-muted rounded-lg font-semibold text-sm hover:text-primary hover:border-primary transition-colors"
          >
            Back
          </button>
        </div>
      </aside>
    </div>
  );
}
