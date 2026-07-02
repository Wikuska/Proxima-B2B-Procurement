import { useState } from "react";
import { Navigate } from "react-router-dom";
import type { AddressIn } from "../../api/address";
import type {
  BillingDocumentIn,
  DocumentType,
  PurchaseType,
} from "../../api/order";
import CheckoutStepper from "../../components/checkout/CheckoutStepper";
import AddressPicker from "../../components/checkout/AddressPicker";
import {
  useCompanyBillingAddress,
  useCompanyShippingAddresses,
  usePersonalAddresses,
} from "../../hooks/address/useAddresses";
import { useCreateOrder } from "../../hooks/order/useOrders";
import { useCartQuote } from "../../hooks/pricing/useCartQuote";
import { useCartView } from "../../hooks/cart/useCartView";
import { useAuth } from "../../hooks/user/useAuth";
import { usePurchaseMode } from "../../store/purchaseModeStore";

const inputClass =
  "w-full px-3 py-2 text-sm border border-border-base rounded-lg focus:outline-none focus:border-border-focus bg-bg-surface text-text-main";

interface BillingFormState {
  documentType: DocumentType;
  firstName: string;
  lastName: string;
  companyName: string;
  companyNip: string;
  billingStreet: string;
  billingCity: string;
  billingPostalCode: string;
  billingCountry: string;
}

const emptyBilling: BillingFormState = {
  documentType: "RECEIPT",
  firstName: "",
  lastName: "",
  companyName: "",
  companyNip: "",
  billingStreet: "",
  billingCity: "",
  billingPostalCode: "",
  billingCountry: "",
};

function isBillingComplete(
  f: BillingFormState,
  isCompanyMode: boolean,
): boolean {
  if (isCompanyMode) return true;
  if (f.documentType === "RECEIPT") return true;
  const hasAddr =
    !!f.billingStreet &&
    !!f.billingCity &&
    !!f.billingPostalCode &&
    !!f.billingCountry;
  if (f.documentType === "PERSONAL_INVOICE")
    return !!f.firstName && !!f.lastName && hasAddr;
  if (f.documentType === "COMPANY_INVOICE")
    return !!f.companyName && !!f.companyNip && hasAddr;
  return false;
}

function buildBillingDocumentIn(
  f: BillingFormState,
  isCompanyMode: boolean,
): BillingDocumentIn {
  if (isCompanyMode) return { document_type: "COMPANY_INVOICE" };
  if (f.documentType === "RECEIPT") return { document_type: "RECEIPT" };
  const base = {
    document_type: f.documentType,
    billing_street: f.billingStreet,
    billing_city: f.billingCity,
    billing_postal_code: f.billingPostalCode,
    billing_country: f.billingCountry,
  };
  if (f.documentType === "PERSONAL_INVOICE") {
    return { ...base, first_name: f.firstName, last_name: f.lastName };
  }
  return { ...base, company_name: f.companyName, company_nip: f.companyNip };
}

export default function CheckoutPage() {
  const { user } = useAuth();
  const purchaseModeStore = usePurchaseMode();

  const { lines, quoteItems } = useCartView();
  const selectedLines = lines.filter((l) => l.available && l.selected);

  // Whether any selected line is a B2B-only product.
  const hasB2bSelected = selectedLines.some((l) => l.is_b2b_only);
  const hasCompany = !!user?.company_id;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [purchaseType, setPurchaseType] = useState<PurchaseType>(
    purchaseModeStore === "COMPANY" && hasCompany ? "B2B" : "B2C",
  );
  const [addressId, setAddressId] = useState<string | null>(null);
  const [inlineAddress, setInlineAddress] = useState<AddressIn | null>(null);
  const [saveAddress, setSaveAddress] = useState(false);
  const [billing, setBilling] = useState<BillingFormState>(emptyBilling);

  const { data: personalAddresses = [] } = usePersonalAddresses();
  const { data: companyAddresses = [] } = useCompanyShippingAddresses();
  const { data: companyBillingAddress } = useCompanyBillingAddress();

  const { data: quote } = useCartQuote(quoteItems);
  const createOrder = useCreateOrder();

  // When cart has b2b-only items and user has a company → force B2B regardless of stored mode.
  const effectivePurchaseType: PurchaseType =
    hasB2bSelected && hasCompany ? "B2B" : purchaseType;
  const isCompanyMode = effectivePurchaseType === "B2B";
  const hasB2B = hasCompany;
  const grandTotal = quote ? Number(quote.grand_total) : null;

  function changePurchaseType(type: PurchaseType) {
    setPurchaseType(type);
    setAddressId(null);
    setInlineAddress(null);
  }

  const selectedAddress = isCompanyMode
    ? companyAddresses.find((a) => a.id === addressId)
    : personalAddresses.find((a) => a.id === addressId);

  // B2B-only products without a company account → hard block on step 1.
  const b2bBlockedNoCompany = hasB2bSelected && !hasCompany;

  const canProceedToDocument =
    !b2bBlockedNoCompany &&
    (isCompanyMode ? !!addressId : !!addressId || !!inlineAddress);

  function handlePlaceOrder() {
    const payload = {
      product_ids: selectedLines.map((l) => l.product_id),
      purchase_type: effectivePurchaseType,
      document: buildBillingDocumentIn(billing, isCompanyMode),
      ...(addressId ? { address_id: addressId } : {}),
      ...(inlineAddress
        ? { shipping_address: inlineAddress, save_address: saveAddress }
        : {}),
    };
    createOrder.mutate(payload);
  }

  if (selectedLines.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-text-main mb-8">Checkout</h1>
      <CheckoutStepper currentStep={step} />

      {/* ── Step 1: Purchase type + Shipping address ── */}
      {step === 1 && (
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
                    <span className="text-sm text-text-main">
                      Private (B2C)
                    </span>
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
                    <span className="text-sm text-text-main">
                      Company (B2B)
                    </span>
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
            onClick={() => setStep(2)}
            disabled={!canProceedToDocument}
            className="w-full py-3.5 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            Continue to Document
          </button>
        </div>
      )}

      {/* ── Step 2: Billing document ── */}
      {step === 2 && (
        <div className="space-y-8">
          {isCompanyMode ? (
            <CompanyInvoiceReadOnly
              billingAddress={companyBillingAddress ?? null}
            />
          ) : (
            <PrivateBillingForm billing={billing} onChange={setBilling} />
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-3.5 border border-border-base text-text-muted rounded-lg font-semibold text-sm hover:text-primary hover:border-primary transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!isBillingComplete(billing, isCompanyMode)}
              className="flex-1 py-3.5 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              Review Order
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Review ── */}
      {step === 3 && (
        <div className="space-y-6">
          <section className="bg-bg-surface border border-border-base/20 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-text-main mb-4">
              Items
            </h2>
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
              onClick={() => setStep(2)}
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

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface AddressOut {
  street: string;
  city: string;
  postal_code: string;
  country: string;
  label?: string | null;
}

function CompanyInvoiceReadOnly({
  billingAddress,
}: {
  billingAddress: AddressOut | null;
}) {
  return (
    <section className="bg-bg-surface border border-border-base/20 rounded-2xl p-6 shadow-sm space-y-4">
      <h2 className="text-base font-semibold text-text-main">
        Billing document
      </h2>
      <div className="p-4 bg-bg-base border border-primary/20 rounded-xl space-y-1">
        <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">
          Company Invoice
        </p>
        <p className="text-sm text-text-muted">
          Invoice data will be taken from your company profile (name, NIP) and
          the registered billing address.
        </p>
        {billingAddress ? (
          <p className="text-sm text-text-main mt-2">
            <span className="font-medium">Billing address:</span>{" "}
            {billingAddress.street}, {billingAddress.city}{" "}
            {billingAddress.postal_code}, {billingAddress.country}
          </p>
        ) : (
          <p className="text-sm text-red-500 mt-2">
            ⚠ Your company has no billing address set. Ask a company admin to
            add one before placing an order.
          </p>
        )}
      </div>
    </section>
  );
}

function PrivateBillingForm({
  billing,
  onChange,
}: {
  billing: BillingFormState;
  onChange: (b: BillingFormState) => void;
}) {
  function set<K extends keyof BillingFormState>(
    key: K,
    value: BillingFormState[K],
  ) {
    onChange({ ...billing, [key]: value });
  }

  const needsBillingAddr =
    billing.documentType === "PERSONAL_INVOICE" ||
    billing.documentType === "COMPANY_INVOICE";

  return (
    <section className="bg-bg-surface border border-border-base/20 rounded-2xl p-6 shadow-sm space-y-5">
      <h2 className="text-base font-semibold text-text-main">
        Billing document
      </h2>

      {/* Document type radio */}
      <div className="space-y-2">
        {(
          [
            ["RECEIPT", "Receipt — no invoice"],
            ["PERSONAL_INVOICE", "Personal invoice"],
            ["COMPANY_INVOICE", "Company invoice (manual)"],
          ] as [DocumentType, string][]
        ).map(([val, label]) => (
          <label key={val} className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="doc-type"
              checked={billing.documentType === val}
              onChange={() => set("documentType", val)}
              className="accent-primary"
            />
            <span className="text-sm text-text-main">{label}</span>
          </label>
        ))}
      </div>

      {/* PERSONAL_INVOICE fields */}
      {billing.documentType === "PERSONAL_INVOICE" && (
        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input
                value={billing.firstName}
                onChange={(e) => set("firstName", e.target.value)}
                placeholder="First name"
                className={inputClass}
              />
            </div>
            <div>
              <input
                value={billing.lastName}
                onChange={(e) => set("lastName", e.target.value)}
                placeholder="Last name"
                className={inputClass}
              />
            </div>
          </div>
        </div>
      )}

      {/* COMPANY_INVOICE fields */}
      {billing.documentType === "COMPANY_INVOICE" && (
        <div className="space-y-3 pt-2">
          <input
            value={billing.companyName}
            onChange={(e) => set("companyName", e.target.value)}
            placeholder="Company name"
            className={inputClass}
          />
          <input
            value={billing.companyNip}
            onChange={(e) => set("companyNip", e.target.value)}
            placeholder="Tax ID (NIP)"
            className={inputClass}
          />
        </div>
      )}

      {/* Billing address (shared for invoices) */}
      {needsBillingAddr && (
        <div className="space-y-3 pt-1">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
            Billing address
          </p>
          <input
            value={billing.billingStreet}
            onChange={(e) => set("billingStreet", e.target.value)}
            placeholder="Street address"
            className={inputClass}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              value={billing.billingCity}
              onChange={(e) => set("billingCity", e.target.value)}
              placeholder="City"
              className={inputClass}
            />
            <input
              value={billing.billingPostalCode}
              onChange={(e) => set("billingPostalCode", e.target.value)}
              placeholder="Postal code"
              className={inputClass}
            />
          </div>
          <input
            value={billing.billingCountry}
            onChange={(e) => set("billingCountry", e.target.value)}
            placeholder="Country"
            className={inputClass}
          />
        </div>
      )}
    </section>
  );
}
