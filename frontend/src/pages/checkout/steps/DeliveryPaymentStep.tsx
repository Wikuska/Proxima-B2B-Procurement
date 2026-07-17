import { useEffect, useState } from "react";
import { Navigate, useNavigate, useOutletContext } from "react-router-dom";
import CheckoutSection from "../../../components/checkout/CheckoutSection";
import OrderSummarySidebar from "../../../components/checkout/OrderSummarySidebar";
import { TwoColumn } from "../../../layouts/CartCheckoutLayout";
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
    isB2bPurchase,
    selectedLines,
    quote,
    shippingCost,
    setDeliveryConfirmed,
  } = useOutletContext<CheckoutContext>();

  const [triedNext, setTriedNext] = useState(false);

  useEffect(() => {
    setDeliveryConfirmed(true);
  }, [setDeliveryConfirmed]);

  if (!canProceedToDelivery) {
    return <Navigate to="/checkout/details" replace />;
  }

  function handleContinue() {
    setTriedNext(true);
    if (canProceedToSummary) navigate("/checkout/summary");
  }

  return (
    <TwoColumn
      sidebar={
        <OrderSummarySidebar
          lines={selectedLines}
          quote={quote}
          shippingCost={shippingCost}
          nextLabel="Proceed to Summary"
          onNext={handleContinue}
          onBack={() => navigate("/checkout/details")}
        />
      }
    >
      <CheckoutSection title="Delivery method">
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
      </CheckoutSection>

      <CheckoutSection title="Payment method">
        <div className="space-y-2">
          {checkoutOptions?.payment_methods.map((opt) => {
            const disabled = opt.b2b_only && !isB2bPurchase;
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
      </CheckoutSection>

      {triedNext && !canProceedToSummary && (
        <p className="text-xs font-semibold text-red-500 -mt-4">
          Please select a delivery and payment method to continue.
        </p>
      )}
    </TwoColumn>
  );
}
