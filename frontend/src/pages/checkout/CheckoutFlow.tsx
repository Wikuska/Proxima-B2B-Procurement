import { useState } from "react";
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
  emptyBilling,
  isBillingComplete,
  type BillingFormState,
  type CheckoutContext,
} from "./checkoutTypes";

/**
 * Route element for `/checkout/*`. Not a visual shell like `MainLayout` —
 * it owns the wizard state (purchase type, address, recipient, delivery,
 * payment, billing document, note) and data hooks for the whole checkout
 * flow, exposing them to the step routes (`DetailsStep`, `DeliveryPaymentStep`,
 * `SummaryStep`) via `useOutletContext`. It only *also* renders the shared
 * `CheckoutStepper` + `<Outlet />`.
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
  const [billing, setBilling] = useState<BillingFormState>(emptyBilling);

  // Recipient name/email default to the ordering user's details until
  // explicitly overridden — avoids an effect just to "sync" default values.
  const [recipientNameOverride, setRecipientNameOverride] = useState<string | null>(null);
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientEmailOverride, setRecipientEmailOverride] = useState<string | null>(null);
  const recipientName =
    recipientNameOverride ?? (user ? `${user.first_name} ${user.last_name}`.trim() : "");
  const recipientEmail = recipientEmailOverride ?? (user?.email ?? "");

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
    const [firstName, ...rest] = recipientName.trim().split(/\s+/);
    const addr = selectedAddress ?? inlineAddress;
    setBilling({
      ...billing,
      firstName: firstName ?? "",
      lastName: rest.join(" "),
      billingStreet: addr?.street ?? billing.billingStreet,
      billingCity: addr?.city ?? billing.billingCity,
      billingPostalCode: addr?.postal_code ?? billing.billingPostalCode,
      billingCountry: addr?.country ?? billing.billingCountry,
    });
  }

  // B2B-only products without a company account → hard block on the details step.
  const b2bBlockedNoCompany = hasB2bSelected && !hasCompany;

  const canProceedToDelivery =
    !b2bBlockedNoCompany &&
    (isCompanyMode ? !!addressId : !!addressId || !!inlineAddress) &&
    !!recipientName.trim() &&
    !!recipientPhone.trim() &&
    isBillingComplete(billing, isCompanyMode);

  const canProceedToSummary =
    canProceedToDelivery &&
    !!deliveryMethod &&
    !!paymentMethod &&
    !(paymentMethod === "DEFERRED" && !isCompanyMode);

  function handlePlaceOrder() {
    const payload: OrderCreate = {
      product_ids: selectedLines.map((l) => l.product_id),
      purchase_type: effectivePurchaseType,
      document: buildBillingDocumentIn(billing, isCompanyMode),
      ...(addressId ? { address_id: addressId } : {}),
      ...(inlineAddress
        ? { shipping_address: inlineAddress, save_address: saveAddress }
        : {}),
      delivery_method: deliveryMethod,
      payment_method: paymentMethod,
      recipient_name: recipientName.trim(),
      recipient_phone: recipientPhone.trim(),
      ...(recipientEmail.trim() ? { recipient_email: recipientEmail.trim() } : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
    };
    createOrder.mutate(payload);
  }

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

    recipientName,
    setRecipientName: setRecipientNameOverride,
    recipientPhone,
    setRecipientPhone,
    recipientEmail,
    setRecipientEmail: setRecipientEmailOverride,

    deliveryMethod,
    setDeliveryMethod,
    paymentMethod,
    setPaymentMethod,
    deliveryConfirmed,
    setDeliveryConfirmed,

    billing,
    setBilling,
    copyRecipientToBilling,

    note,
    setNote,

    canProceedToDelivery,
    canProceedToSummary,
    isBillingComplete: isBillingComplete(billing, isCompanyMode),

    handlePlaceOrder,
    isPlacingOrder: createOrder.isPending,
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <CheckoutStepper />
      <Outlet context={checkoutCtx} />
    </div>
  );
}
