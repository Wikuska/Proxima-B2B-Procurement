import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import AddressPicker from "../../../components/checkout/AddressPicker";
import OrderSummarySidebar from "../../../components/checkout/OrderSummarySidebar";
import {
  CompanyInvoiceReadOnly,
  PrivateBillingForm,
} from "../BillingDocumentForm";
import type { CheckoutContext } from "../checkoutTypes";

const inputClass =
  "w-full px-3 py-2 text-sm border border-border-base rounded-lg focus:outline-none focus:border-primary bg-bg-surface text-text-main";

export default function DetailsStep() {
  const navigate = useNavigate();
  const {
    hasB2bSelected,
    hasCompany,
    b2bBlockedNoCompany,
    effectivePurchaseType,
    isCompanyMode,
    hasB2B,
    changePurchaseType,
    companyAddresses,
    personalAddresses,
    addressId,
    setAddressId,
    inlineAddress,
    setInlineAddress,
    setSaveAddress,
    recipientName,
    setRecipientName,
    recipientPhone,
    setRecipientPhone,
    recipientEmail,
    setRecipientEmail,
    companyBillingAddress,
    billing,
    setBilling,
    copyRecipientToBilling,
    canProceedToDelivery,
    selectedLines,
    quote,
    shippingCost,
    deliveryConfirmed,
  } = useOutletContext<CheckoutContext>();

  const [copyToBilling, setCopyToBilling] = useState(false);

  const hasShippingAddress = isCompanyMode
    ? !!addressId
    : !!addressId || !!inlineAddress;
  const needsBillingAddr =
    !isCompanyMode &&
    (billing.documentType === "PERSONAL_INVOICE" ||
      billing.documentType === "COMPANY_INVOICE");

  function toggleCopyToBilling(checked: boolean) {
    setCopyToBilling(checked);
    if (checked) copyRecipientToBilling();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
      <div className="space-y-8">
        {/* B2B-only blocker — no company account */}
        {b2bBlockedNoCompany && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700 space-y-2">
            <p className="font-semibold">Company account required</p>
            <p>
              Your cart contains products available to company accounts only.
              Remove them from the cart or{" "}
              <a
                href="/profile/company-affiliation"
                className="underline font-medium"
              >
                join a company
              </a>{" "}
              to continue.
            </p>
          </div>
        )}

        <section className="bg-bg-surface border border-border-base/20 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-text-main mb-4">
            Purchase type
          </h2>

          {/* Forced B2B — cart has b2b-only + user has company */}
          {hasB2bSelected && hasCompany ? (
            <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl">
              <span className="text-sm font-semibold text-primary">
                Company (B2B)
              </span>
              <span className="text-xs text-text-muted">
                your cart contains company-only products
              </span>
            </div>
          ) : (
            <>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="purchase-type"
                    value="B2C"
                    checked={effectivePurchaseType === "B2C"}
                    onChange={() => changePurchaseType("B2C")}
                    className="accent-primary"
                  />
                  <span className="text-sm text-text-main">Private (B2C)</span>
                </label>
                <label
                  className={`flex items-center gap-2 ${hasB2B ? "cursor-pointer" : "opacity-40 cursor-not-allowed"}`}
                >
                  <input
                    type="radio"
                    name="purchase-type"
                    value="B2B"
                    checked={effectivePurchaseType === "B2B"}
                    onChange={() => changePurchaseType("B2B")}
                    disabled={!hasB2B}
                    className="accent-primary"
                  />
                  <span className="text-sm text-text-main">Company (B2B)</span>
                </label>
              </div>
              {!hasB2B && (
                <p className="text-xs text-text-muted mt-2">
                  Company mode requires a company account.
                </p>
              )}
            </>
          )}
        </section>

        <section className="bg-bg-surface border border-border-base/20 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-text-main mb-4">
            Shipping address
          </h2>
          {isCompanyMode ? (
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

        <section className="bg-bg-surface border border-border-base/20 rounded-2xl p-6 shadow-sm space-y-3">
          <h2 className="text-xl font-bold text-text-main mb-1">Recipient</h2>
          <p className="text-xs text-text-muted -mt-1 mb-4">
            Who should receive this order? Defaults to your account details but
            can be edited.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <input
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Full name"
              className={inputClass}
            />
            <input
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="Phone number"
              className={inputClass}
            />
          </div>
          <input
            type="email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            placeholder="Email (optional)"
            className={inputClass}
          />
        </section>

        {isCompanyMode ? (
          <CompanyInvoiceReadOnly
            billingAddress={companyBillingAddress ?? null}
          />
        ) : (
          <>
            <PrivateBillingForm billing={billing} onChange={setBilling} />
            {needsBillingAddr && hasShippingAddress && (
              <label className="flex items-center gap-3 cursor-pointer -mt-4 px-1">
                <input
                  type="checkbox"
                  checked={copyToBilling}
                  onChange={(e) => toggleCopyToBilling(e.target.checked)}
                  className="accent-primary"
                />
                <span className="text-sm text-text-main">
                  Use recipient data for the invoice
                </span>
              </label>
            )}
          </>
        )}
      </div>

      <OrderSummarySidebar
        lines={selectedLines}
        quote={quote}
        shippingCost={deliveryConfirmed ? shippingCost : null}
        nextLabel="Proceed to Delivery & Payment"
        onNext={() => navigate("/checkout/delivery")}
        nextDisabled={!canProceedToDelivery}
      />
    </div>
  );
}
