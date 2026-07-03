import { useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import type { AddressIn } from "../../api/address";
import type { PurchaseType } from "../../api/order";
import CheckoutStepper from "../../components/checkout/CheckoutStepper";
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
import {
  buildBillingDocumentIn,
  emptyBilling,
  isBillingComplete,
  type BillingFormState,
  type CheckoutContext,
} from "./checkoutTypes";

/**
 * Route element for `/checkout/*`. Not a visual shell like `MainLayout` —
 * it owns the wizard state (purchase type, address, billing document) and
 * data hooks for the whole checkout flow, exposing them to the step routes
 * (`ShippingStep`, `DocumentStep`, `ReviewStep`) via `useOutletContext`.
 * It only *also* renders the shared `CheckoutStepper` + `<Outlet />`.
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

  // B2B-only products without a company account → hard block on shipping step.
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

  const checkoutCtx: CheckoutContext = {
    selectedLines,
    quote,
    grandTotal,

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

    billing,
    setBilling,

    canProceedToDocument,
    isBillingComplete: isBillingComplete(billing, isCompanyMode),

    handlePlaceOrder,
    isPlacingOrder: createOrder.isPending,
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-text-main mb-8">Checkout</h1>
      <CheckoutStepper />
      <Outlet context={checkoutCtx} />
    </div>
  );
}
