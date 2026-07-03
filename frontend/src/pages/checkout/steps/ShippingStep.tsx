import { useNavigate, useOutletContext } from "react-router-dom";
import AddressPicker from "../../../components/checkout/AddressPicker";
import type { CheckoutContext } from "../checkoutTypes";

export default function ShippingStep() {
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
    setInlineAddress,
    setSaveAddress,
    canProceedToDocument,
  } = useOutletContext<CheckoutContext>();

  return (
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
        <h2 className="text-base font-semibold text-text-main mb-4">
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
        <h2 className="text-base font-semibold text-text-main mb-4">
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

      <button
        onClick={() => navigate("/checkout/document")}
        disabled={!canProceedToDocument}
        className="w-full py-3.5 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
      >
        Continue to Document
      </button>
    </div>
  );
}
