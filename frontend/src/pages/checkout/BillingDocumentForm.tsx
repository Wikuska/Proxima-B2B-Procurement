import { useFormContext } from "react-hook-form";
import FormInput from "../../components/forms/FormInput";
import type { DocumentType } from "../../api/order";
import type { DetailsFormData } from "../../schemas/checkoutSchema";

interface AddressOut {
  street: string;
  city: string;
  postal_code: string;
  country: string;
  label?: string | null;
}

export function CompanyInvoiceReadOnly({
  billingAddress,
}: {
  billingAddress: AddressOut | null;
}) {
  return (
    <section className="bg-bg-surface border border-border-base/20 rounded-2xl p-6 shadow-sm space-y-4">
      <h2 className="text-xl font-bold text-text-main">Billing document</h2>
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

export function PrivateBillingForm({
  allowedDocumentTypes,
}: {
  allowedDocumentTypes: DocumentType[];
}) {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<DetailsFormData>();

  const documentType = watch("billing.documentType");
  const needsBillingAddr =
    documentType === "PERSONAL_INVOICE" || documentType === "COMPANY_INVOICE";
  const showDocumentTypeRadios = allowedDocumentTypes.length > 1;

  const documentTypeOptions: [DocumentType, string][] = [
    ["RECEIPT", "Receipt — no invoice"],
    ["PERSONAL_INVOICE", "Personal invoice"],
    ["COMPANY_INVOICE", "Company invoice (manual)"],
  ];

  const billingErrors = errors.billing as
    | Partial<
        Record<
          | "firstName"
          | "lastName"
          | "companyName"
          | "companyNip"
          | "billingStreet"
          | "billingCity"
          | "billingPostalCode"
          | "billingCountry",
          { message?: string }
        >
      >
    | undefined;

  return (
    <section className="bg-bg-surface border border-border-base/20 rounded-2xl p-6 shadow-sm space-y-5">
      <h2 className="text-xl font-bold text-text-main">Billing document</h2>

      {showDocumentTypeRadios ? (
        <div className="space-y-2">
          {documentTypeOptions
            .filter(([val]) => allowedDocumentTypes.includes(val))
            .map(([val, label]) => (
              <label key={val} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  value={val}
                  {...register("billing.documentType")}
                  className="accent-primary"
                />
                <span className="text-sm text-text-main">{label}</span>
              </label>
            ))}
        </div>
      ) : (
        <p className="text-xs font-semibold text-primary uppercase tracking-wide">
          Company invoice
        </p>
      )}

      {documentType === "COMPANY_INVOICE" && showDocumentTypeRadios && (
        <p className="text-xs text-text-muted -mt-2">
          Enter company details manually. Company pricing and B2B-only products
          do not apply in private purchase mode.
        </p>
      )}

      {/* Wspólny kontener na wszystkie inputy wymuszający równe odstępy */}
      <div className="flex flex-col gap-1">
        {/* PERSONAL_INVOICE fields */}
        {documentType === "PERSONAL_INVOICE" && (
          <div className="grid grid-cols-2 gap-3">
            <FormInput
              {...register("billing.firstName")}
              id="billingFirstName"
              label="First name"
              placeholder="First name"
              hideLabel
              error={billingErrors?.firstName?.message}
            />
            <FormInput
              {...register("billing.lastName")}
              id="billingLastName"
              label="Last name"
              placeholder="Last name"
              hideLabel
              error={billingErrors?.lastName?.message}
            />
          </div>
        )}

        {/* COMPANY_INVOICE fields */}
        {documentType === "COMPANY_INVOICE" && (
          <>
            <FormInput
              {...register("billing.companyName")}
              id="billingCompanyName"
              label="Company name"
              placeholder="Company name"
              hideLabel
              error={billingErrors?.companyName?.message}
            />
            <FormInput
              {...register("billing.companyNip")}
              id="billingCompanyNip"
              label="Tax ID (NIP)"
              placeholder="Tax ID (NIP)"
              hideLabel
              error={billingErrors?.companyNip?.message}
            />
          </>
        )}

        {/* Billing address (shared for invoices) */}
        {needsBillingAddr && (
          <>
            <FormInput
              {...register("billing.billingStreet")}
              id="billingStreet"
              label="Street address"
              placeholder="Street address"
              hideLabel
              error={billingErrors?.billingStreet?.message}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormInput
                {...register("billing.billingCity")}
                id="billingCity"
                label="City"
                placeholder="City"
                hideLabel
                error={billingErrors?.billingCity?.message}
              />
              <FormInput
                {...register("billing.billingPostalCode")}
                id="billingPostalCode"
                label="Postal code"
                placeholder="Postal code"
                hideLabel
                error={billingErrors?.billingPostalCode?.message}
              />
            </div>
            <FormInput
              {...register("billing.billingCountry")}
              id="billingCountry"
              label="Country"
              placeholder="Country"
              hideLabel
              error={billingErrors?.billingCountry?.message}
            />
          </>
        )}
      </div>
    </section>
  );
}
