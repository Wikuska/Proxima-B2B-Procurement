import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { Navigate, Outlet } from "react-router-dom";
import type { AddressIn } from "../../api/address";
import type { DeliveryMethod, OrderCreate, PaymentMethod, PurchaseType } from "../../api/order";
import CheckoutStepper from "../../components/checkout/CheckoutStepper";
import {
  useCompanyBillingAddress,
  useCompanyShippingAddresses,
  usePersonalAddresses,
} from "../../hooks/address/useAddresses";
import { useCheckoutOptions, useCreateOrder } from "../../hooks/order/useOrders";
import { useCartQuote } from "../../hooks/pricing/useCartQuote";
import { useCartView } from "../../hooks/cart/useCartView";
import { useAuth } from "../../hooks/user/useAuth";
import { usePurchaseMode } from "../../store/purchaseModeStore";
import {
  buildBillingDocumentIn,
  detailsSchema,
  emptyBillingValues,
  type DetailsFormData,
} from "../../schemas/checkoutSchema";
import type { CheckoutContext } from "./checkoutTypes";

/**
 * Route element for `/checkout/*`. Not a visual shell like `MainLayout` —
 * it owns the wizard state (purchase type, address, delivery, payment, note)
 * and data hooks for the whole checkout flow, exposing them to the step
 * routes (`DetailsStep`, `DeliveryPaymentStep`, `SummaryStep`) via
 * `useOutletContext`. Recipient + billing document fields live on a single
 * shared `useForm<DetailsFormData>` instance, exposed to the steps via
 * `<FormProvider>` / `useFormContext` so validation state survives step
 * route changes. It only *also* renders the shared `CheckoutStepper` +
 * `<Outlet />`.
 */
export default function CheckoutFlow() {
  const { user } = useAuth();
  const purchaseModeStore = usePurchaseMode();

  const { lines, quoteItems } = useCartView();
  const selectedLines = lines.filter((l) => l.available && l.selected);

  // Whether any selected line is a B2B-only product.
  const hasB2bSelected = selectedLines.some((l) => l.is_b2b_only);
  const hasCompany = !!user?.company_id;

  const [purchaseType, setPurchaseType] = useState<PurchaseType>(
    purchaseModeStore === "COMPANY" && hasCompany ? "B2B" : "B2C",
  );
  const [addressId, setAddressId] = useState<string | null>(null);
  const [inlineAddress, setInlineAddress] = useState<AddressIn | null>(null);
  const [saveAddress, setSaveAddress] = useState(false);

  const methods = useForm<DetailsFormData>({
    resolver: zodResolver(detailsSchema),
    reValidateMode: "onBlur",
    defaultValues: {
      recipient: {
        recipient_name: user ? `${user.first_name} ${user.last_name}`.trim() : "",
        recipient_email: user?.email ?? "",
        recipient_phone: "",
      },
      billing: emptyBillingValues,
    },
  });
  const { getValues, setValue, handleSubmit, control } = methods;
  // Subscribing here re-renders CheckoutFlow on every field change so the
  // derived guards below (and the outlet context they feed) stay fresh —
  // the fields themselves are registered deeper in the tree via useFormContext.
  const watchedValues = useWatch({ control });

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("COURIER");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("BANK_TRANSFER");
  const [deliveryConfirmed, setDeliveryConfirmed] = useState(false);
  const [note, setNote] = useState("");

  const { data: personalAddresses = [] } = usePersonalAddresses();
  const { data: companyAddresses = [] } = useCompanyShippingAddresses();
  const { data: companyBillingAddress } = useCompanyBillingAddress();
  const { data: checkoutOptions } = useCheckoutOptions();

  const { data: quote } = useCartQuote(quoteItems);
  const createOrder = useCreateOrder();

  // When cart has b2b-only items and user has a company → force B2B regardless of stored mode.
  const effectivePurchaseType: PurchaseType =
    hasB2bSelected && hasCompany ? "B2B" : purchaseType;
  const isCompanyMode = effectivePurchaseType === "B2B";
  const hasB2B = hasCompany;
  const grandTotal = quote ? Number(quote.grand_total) : null;

  const shippingCost = Number(
    checkoutOptions?.delivery_methods.find(
      (d) => d.delivery_method === deliveryMethod,
    )?.cost ?? 0,
  );
  const orderTotal = grandTotal !== null ? grandTotal + shippingCost : null;

  function changePurchaseType(type: PurchaseType) {
    setPurchaseType(type);
    setAddressId(null);
    setInlineAddress(null);
    if (type !== "B2B" && paymentMethod === "DEFERRED") {
      setPaymentMethod("BANK_TRANSFER");
    }
  }

  const selectedAddress = isCompanyMode
    ? companyAddresses.find((a) => a.id === addressId)
    : personalAddresses.find((a) => a.id === addressId);

  function copyRecipientToBilling() {
    const recipient = getValues("recipient");
    const [firstName, ...rest] = recipient.recipient_name.trim().split(/\s+/);
    const addr = selectedAddress ?? inlineAddress;
    setValue("billing.firstName", firstName ?? "", { shouldValidate: true });
    setValue("billing.lastName", rest.join(" "), { shouldValidate: true });
    if (addr) {
      setValue("billing.billingStreet", addr.street, { shouldValidate: true });
      setValue("billing.billingCity", addr.city, { shouldValidate: true });
      setValue("billing.billingPostalCode", addr.postal_code, { shouldValidate: true });
      setValue("billing.billingCountry", addr.country, { shouldValidate: true });
    }
  }

  // B2B-only products without a company account → hard block on the details step.
  const b2bBlockedNoCompany = hasB2bSelected && !hasCompany;

  const hasShippingAddress = isCompanyMode
    ? !!addressId
    : !!addressId || !!inlineAddress;
  const isDetailsValid = detailsSchema.safeParse(watchedValues).success;

  const canProceedToDelivery =
    !b2bBlockedNoCompany && isDetailsValid && hasShippingAddress;

  const canProceedToSummary =
    canProceedToDelivery &&
    !!deliveryMethod &&
    !!paymentMethod &&
    !(paymentMethod === "DEFERRED" && !isCompanyMode);

  function submitOrder(data: DetailsFormData) {
    const payload: OrderCreate = {
      product_ids: selectedLines.map((l) => l.product_id),
      purchase_type: effectivePurchaseType,
      document: buildBillingDocumentIn(data.billing, isCompanyMode),
      ...(addressId ? { address_id: addressId } : {}),
      ...(inlineAddress
        ? { shipping_address: inlineAddress, save_address: saveAddress }
        : {}),
      delivery_method: deliveryMethod,
      payment_method: paymentMethod,
      recipient_name: data.recipient.recipient_name.trim(),
      recipient_phone: data.recipient.recipient_phone.trim(),
      ...(data.recipient.recipient_email.trim()
        ? { recipient_email: data.recipient.recipient_email.trim() }
        : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
    };
    createOrder.mutate(payload);
  }

  const handlePlaceOrder = handleSubmit(submitOrder);

  if (selectedLines.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  const checkoutCtx: CheckoutContext = {
    selectedLines,
    quote,
    grandTotal,

    checkoutOptions,
    shippingCost,
    orderTotal,

    purchaseType,
    effectivePurchaseType,
    isCompanyMode,
    hasB2B,
    hasCompany,
    hasB2bSelected,
    b2bBlockedNoCompany,
    changePurchaseType,

    personalAddresses,
    companyAddresses,
    companyBillingAddress,
    addressId,
    setAddressId,
    inlineAddress,
    setInlineAddress,
    saveAddress,
    setSaveAddress,
    selectedAddress,

    deliveryMethod,
    setDeliveryMethod,
    paymentMethod,
    setPaymentMethod,
    deliveryConfirmed,
    setDeliveryConfirmed,

    copyRecipientToBilling,

    note,
    setNote,

    isDetailsValid,
    hasShippingAddress,
    canProceedToDelivery,
    canProceedToSummary,

    handlePlaceOrder,
    isPlacingOrder: createOrder.isPending,
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <CheckoutStepper />
      <FormProvider {...methods}>
        <Outlet context={checkoutCtx} />
      </FormProvider>
    </div>
  );
}
