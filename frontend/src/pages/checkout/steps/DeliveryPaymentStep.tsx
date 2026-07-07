import { useEffect } from "react";
import { Navigate, useNavigate, useOutletContext } from "react-router-dom";
import OrderSummarySidebar from "../../../components/checkout/OrderSummarySidebar";
import { DELIVERY_LABELS, PAYMENT_LABELS } from "../../../api/order";
import type { CheckoutContext } from "../checkoutTypes";

export default function DeliveryPaymentStep() {
  const navigate = useNavigate();
  const {
    canProceedToDelivery,
    canProceedToSummary,
    checkoutOptions,
    deliveryMethod,
    setDeliveryMethod,
    paymentMethod,
    setPaymentMethod,
    isCompanyMode,
    selectedLines,
    quote,
    shippingCost,
    setDeliveryConfirmed,
  } = useOutletContext<CheckoutContext>();

  // Reaching this step at least once means the shipping cost stays visible
  // in the order summary on step 1 even after the user navigates back.
  useEffect(() => {
    setDeliveryConfirmed(true);
  }, [setDeliveryConfirmed]);

  if (!canProceedToDelivery) {
    return <Navigate to="/checkout/details" replace />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
      <div className="space-y-8">
        <section className="bg-bg-surface border border-border-base/20 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-text-main mb-4">
            Delivery method
          </h2>
          <div className="space-y-2">
            {checkoutOptions?.delivery_methods.map((opt) => {
              const cost = Number(opt.cost);
              return (
                <label
                  key={opt.delivery_method}
                  className="flex items-center justify-between gap-3 p-3 border border-border-base/30 rounded-xl cursor-pointer hover:border-primary/40 transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="delivery-method"
                      checked={deliveryMethod === opt.delivery_method}
                      onChange={() => setDeliveryMethod(opt.delivery_method)}
                      className="accent-primary"
                    />
                    <span className="text-sm text-text-main">
                      {DELIVERY_LABELS[opt.delivery_method]}
                    </span>
                  </span>
                  <span className="text-sm font-mono font-semibold text-text-main">
                    {cost === 0 ? "Free" : `$${cost.toFixed(2)}`}
                  </span>
                </label>
              );
            })}
          </div>
        </section>

        <section className="bg-bg-surface border border-border-base/20 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-text-main mb-4">
            Payment method
          </h2>
          <div className="space-y-2">
            {checkoutOptions?.payment_methods.map((opt) => {
              const disabled = opt.b2b_only && !isCompanyMode;
              return (
                <label
                  key={opt.payment_method}
                  className={`flex items-center justify-between gap-3 p-3 border border-border-base/30 rounded-xl transition-colors ${
                    disabled
                      ? "opacity-40 cursor-not-allowed"
                      : "cursor-pointer hover:border-primary/40"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment-method"
                      disabled={disabled}
                      checked={paymentMethod === opt.payment_method}
                      onChange={() => setPaymentMethod(opt.payment_method)}
                      className="accent-primary"
                    />
                    <span className="text-sm text-text-main">
                      {PAYMENT_LABELS[opt.payment_method]}
                    </span>
                  </span>
                  {opt.b2b_only && (
                    <span className="text-xs text-text-muted">
                      Company accounts only
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </section>
      </div>

      <OrderSummarySidebar
        lines={selectedLines}
        quote={quote}
        shippingCost={shippingCost}
        nextLabel="Proceed to Summary"
        onNext={() => navigate("/checkout/summary")}
        nextDisabled={!canProceedToSummary}
        onBack={() => navigate("/checkout/details")}
      />
    </div>
  );
}
