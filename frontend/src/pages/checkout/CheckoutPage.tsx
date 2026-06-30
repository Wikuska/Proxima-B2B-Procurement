import { useState } from "react";
import { Navigate } from "react-router-dom";
import type { AddressIn } from "../../api/address";
import type { PurchaseType } from "../../api/order";
import CheckoutStepper from "../../components/checkout/CheckoutStepper";
import AddressPicker from "../../components/checkout/AddressPicker";
import { useCompanyAddresses, usePersonalAddresses } from "../../hooks/address/useAddresses";
import { useCreateOrder } from "../../hooks/order/useOrders";
import { useCartQuote } from "../../hooks/pricing/useCartQuote";
import { useCartView } from "../../hooks/cart/useCartView";
import { useAuth } from "../../hooks/user/useAuth";
import { usePurchaseMode } from "../../store/purchaseModeStore";

export default function CheckoutPage() {
  const { user } = useAuth();
  const purchaseModeStore = usePurchaseMode();

  const { lines, quoteItems } = useCartView();
  const selectedLines = lines.filter((l) => l.available && l.selected);

  const [step, setStep] = useState<1 | 2>(1);
  const [purchaseType, setPurchaseType] = useState<PurchaseType>(
    purchaseModeStore === "COMPANY" && !!user?.company_id ? "B2B" : "B2C",
  );
  const [addressId, setAddressId] = useState<string | null>(null);
  const [inlineAddress, setInlineAddress] = useState<AddressIn | null>(null);
  const [saveAddress, setSaveAddress] = useState(false);

  const { data: personalAddresses = [] } = usePersonalAddresses();
  const { data: companyAddresses = [] } = useCompanyAddresses();

  const { data: quote } = useCartQuote(quoteItems);
  const createOrder = useCreateOrder();

  function changePurchaseType(type: PurchaseType) {
    setPurchaseType(type);
    setAddressId(null);
    setInlineAddress(null);
  }

  if (selectedLines.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  const hasB2B = !!user?.company_id;
  const grandTotal = quote ? Number(quote.grand_total) : null;

  const selectedAddress =
    purchaseType === "B2B"
      ? companyAddresses.find((a) => a.id === addressId)
      : personalAddresses.find((a) => a.id === addressId);

  const canProceedToReview =
    purchaseType === "B2B"
      ? !!addressId
      : !!addressId || !!inlineAddress;

  function handlePlaceOrder() {
    const payload = {
      product_ids: selectedLines.map((l) => l.product_id),
      purchase_type: purchaseType,
      ...(addressId ? { address_id: addressId } : {}),
      ...(inlineAddress ? { shipping_address: inlineAddress, save_address: saveAddress } : {}),
    };
    createOrder.mutate(payload);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-text-main mb-8">Checkout</h1>
      <CheckoutStepper currentStep={step} />

      {/* ── Step 1: Document & Address ── */}
      {step === 1 && (
        <div className="space-y-8">
          {/* Document type */}
          <section className="bg-bg-surface border border-border-base/20 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-text-main mb-4">Document type</h2>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="purchase-type"
                  value="B2C"
                  checked={purchaseType === "B2C"}
                  onChange={() => changePurchaseType("B2C")}
                  className="accent-primary"
                />
                <span className="text-sm text-text-main">Receipt (B2C)</span>
              </label>
              <label
                className={`flex items-center gap-2 ${hasB2B ? "cursor-pointer" : "opacity-40 cursor-not-allowed"}`}
              >
                <input
                  type="radio"
                  name="purchase-type"
                  value="B2B"
                  checked={purchaseType === "B2B"}
                  onChange={() => changePurchaseType("B2B")}
                  disabled={!hasB2B}
                  className="accent-primary"
                />
                <span className="text-sm text-text-main">Invoice (B2B)</span>
              </label>
            </div>
            {!hasB2B && (
              <p className="text-xs text-text-muted mt-2">
                Invoice requires a company account.
              </p>
            )}
          </section>

          {/* Shipping address */}
          <section className="bg-bg-surface border border-border-base/20 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-text-main mb-4">Shipping address</h2>
            {purchaseType === "B2B" ? (
              <AddressPicker
                variant="company"
                addresses={companyAddresses}
                selectedId={addressId}
                onSelectSaved={setAddressId}
                onSelectInline={() => {}}
              />
            ) : (
              <AddressPicker
                variant="personal"
                addresses={personalAddresses}
                selectedId={addressId}
                onSelectSaved={(id) => {
                  setAddressId(id || null);
                  setInlineAddress(null);
                }}
                onSelectInline={(data, save) => {
                  setAddressId(null);
                  setInlineAddress(data);
                  setSaveAddress(save);
                }}
              />
            )}
          </section>

          <button
            onClick={() => setStep(2)}
            disabled={!canProceedToReview}
            className="w-full py-3.5 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            Review Order
          </button>
        </div>
      )}

      {/* ── Step 2: Review ── */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Items summary */}
          <section className="bg-bg-surface border border-border-base/20 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-text-main mb-4">Items</h2>
            <div className="divide-y divide-border-base/10">
              {selectedLines.map((l) => {
                const priceLine = quote?.lines.find((ql) => ql.product_id === l.product_id);
                return (
                  <div key={l.product_id} className="py-3 flex justify-between items-center gap-4">
                    <div>
                      <p className="text-sm font-medium text-text-main">{l.name}</p>
                      <p className="text-xs text-text-muted">
                        {l.sku} · qty {l.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-text-main font-mono whitespace-nowrap">
                      ${priceLine ? Number(priceLine.line_total).toFixed(2) : (l.base_price * l.quantity).toFixed(2)}
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

          {/* Address + document */}
          <section className="bg-bg-surface border border-border-base/20 rounded-2xl p-6 shadow-sm space-y-3">
            <h2 className="text-base font-semibold text-text-main">Delivery details</h2>
            <div className="text-sm text-text-muted space-y-1">
              <p>
                <span className="font-medium text-text-main">Document:</span>{" "}
                {purchaseType === "B2B" ? "Invoice (B2B)" : "Receipt (B2C)"}
              </p>
              {selectedAddress && (
                <p>
                  <span className="font-medium text-text-main">Address:</span>{" "}
                  {selectedAddress.street}, {selectedAddress.city}{" "}
                  {selectedAddress.postal_code}, {selectedAddress.country}
                </p>
              )}
              {inlineAddress && (
                <p>
                  <span className="font-medium text-text-main">Address:</span>{" "}
                  {inlineAddress.street}, {inlineAddress.city}{" "}
                  {inlineAddress.postal_code}, {inlineAddress.country}
                </p>
              )}
            </div>
          </section>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-3.5 border border-border-base text-text-muted rounded-lg font-semibold text-sm hover:text-primary hover:border-primary transition-colors"
            >
              Back
            </button>
            <button
              onClick={handlePlaceOrder}
              disabled={createOrder.isPending}
              className="flex-1 py-3.5 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-accent transition-colors disabled:opacity-60 shadow-sm"
            >
              {createOrder.isPending ? "Placing order…" : "Place Order"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
