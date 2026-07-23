import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import type { DocumentType } from "../../../api/order";
import AddressPicker from "../../../components/checkout/AddressPicker";
import Panel from "../../../components/common/Panel";
import OrderSummarySidebar from "../../../components/checkout/OrderSummarySidebar";
import { TwoColumn } from "../../../layouts/CartCheckoutLayout";
import FormInput from "../../../components/forms/FormInput";
import type { DetailsFormData } from "../../../schemas/checkoutSchema";
import {
  CompanyInvoiceReadOnly,
  PrivateBillingForm,
} from "../BillingDocumentForm";
import type { CheckoutContext } from "../checkoutTypes";

export default function DetailsStep() {
  const navigate = useNavigate();
  const {
    isB2bPurchase,
    useProfileBilling,
    companyAddresses,
    personalAddresses,
    addressId,
    setAddressId,
    setInlineAddress,
    setSaveAddress,
    companyBillingAddress,
    copyRecipientToBilling,
    hasShippingAddress,
    selectedLines,
    quote,
    shippingCost,
    deliveryConfirmed,
  } = useOutletContext<CheckoutContext>();

  const {
    register,
    watch,
    trigger,
    formState: { errors },
  } = useFormContext<DetailsFormData>();

  const [copyToBilling, setCopyToBilling] = useState(false);
  const [triedNext, setTriedNext] = useState(false);

  const documentType = watch("billing.documentType");
  const needsBillingAddr =
    !useProfileBilling &&
    (documentType === "PERSONAL_INVOICE" || documentType === "COMPANY_INVOICE");

  const billingDocumentTypes: DocumentType[] = isB2bPurchase
    ? ["COMPANY_INVOICE"]
    : ["RECEIPT", "PERSONAL_INVOICE", "COMPANY_INVOICE"];

  function toggleCopyToBilling(checked: boolean) {
    setCopyToBilling(checked);
    if (checked) copyRecipientToBilling();
  }

  async function handleContinue() {
    setTriedNext(true);
    const ok = await trigger();
    if (ok && hasShippingAddress) navigate("/checkout/delivery");
  }

  return (
    <TwoColumn
      sidebar={
        <OrderSummarySidebar
          lines={selectedLines}
          quote={quote}
          shippingCost={deliveryConfirmed ? shippingCost : null}
          nextLabel="Proceed to Delivery & Payment"
          onNext={handleContinue}
        />
      }
    >
      <div className="flex items-center justify-between gap-4 px-1">
        <p className="text-sm text-text-muted">
          Purchasing as{" "}
          <span className="font-semibold text-text-main">
            {isB2bPurchase ? "Company" : "Private"}
          </span>
        </p>
        <Link
          to="/cart"
          className="text-sm text-accent hover:underline shrink-0"
        >
          Change in cart
        </Link>
      </div>

      <Panel
        title="Shipping address"
        headerAside={
          triedNext && !hasShippingAddress ? (
            <p className="max-w-[50%] shrink-0 text-right text-[11px] font-semibold text-red-500 leading-tight">
              Please select or add a shipping address to continue.
            </p>
          ) : undefined
        }
      >
        {isB2bPurchase ? (
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
      </Panel>

      <Panel
        title="Recipient"
        description="Who should receive this order? Defaults to your account details but can be edited."
      >
        <div className="flex flex-col gap-1">
          <div className="grid grid-cols-2 gap-3">
            <FormInput
              {...register("recipient.recipient_name")}
              id="recipientName"
              label="Full name"
              placeholder="Full name"
              hideLabel
              error={errors.recipient?.recipient_name?.message}
            />
            <FormInput
              {...register("recipient.recipient_phone")}
              id="recipientPhone"
              label="Phone number"
              placeholder="Phone number"
              hideLabel
              error={errors.recipient?.recipient_phone?.message}
            />
          </div>

          <FormInput
            {...register("recipient.recipient_email")}
            id="recipientEmail"
            label="Email (optional)"
            type="email"
            placeholder="Email (optional)"
            hideLabel
            error={errors.recipient?.recipient_email?.message}
          />
        </div>
      </Panel>

      {useProfileBilling ? (
        <CompanyInvoiceReadOnly
          billingAddress={companyBillingAddress ?? null}
        />
      ) : (
        <>
          <PrivateBillingForm allowedDocumentTypes={billingDocumentTypes} />
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
    </TwoColumn>
  );
}
