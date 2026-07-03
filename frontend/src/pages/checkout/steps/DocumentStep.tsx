import { Navigate, useNavigate, useOutletContext } from "react-router-dom";
import type { DocumentType } from "../../../api/order";
import type { BillingFormState, CheckoutContext } from "../checkoutTypes";

const inputClass =
  "w-full px-3 py-2 text-sm border border-border-base rounded-lg focus:outline-none focus:border-border-focus bg-bg-surface text-text-main";

export default function DocumentStep() {
  const navigate = useNavigate();
  const {
    canProceedToDocument,
    isCompanyMode,
    companyBillingAddress,
    billing,
    setBilling,
    isBillingComplete,
  } = useOutletContext<CheckoutContext>();

  if (!canProceedToDocument) {
    return <Navigate to="/checkout/shipping" replace />;
  }

  return (
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
          onClick={() => navigate("/checkout/shipping")}
          className="flex-1 py-3.5 border border-border-base text-text-muted rounded-lg font-semibold text-sm hover:text-primary hover:border-primary transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => navigate("/checkout/review")}
          disabled={!isBillingComplete}
          className="flex-1 py-3.5 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
        >
          Review Order
        </button>
      </div>
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
