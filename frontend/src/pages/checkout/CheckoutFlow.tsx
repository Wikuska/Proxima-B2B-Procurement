import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { Navigate, Outlet } from "react-router-dom";
import type { AddressIn } from "../../api/address";
import type {
  DeliveryMethod,
  OrderCreate,
  PaymentMethod,
} from "../../api/order";
import CheckoutStepper from "../../components/checkout/CheckoutStepper";
import {
  useCompanyBillingAddress,
  useCompanyShippingAddresses,
  usePersonalAddresses,
} from "../../hooks/address/useAddresses";
import {
  useCheckoutOptions,
  useCreateOrder,
} from "../../hooks/order/useOrders";
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
import { cartEligibility } from "../../utils/cartEligibility";
import { derivePurchaseType } from "../../utils/derivePurchaseType";
import type { CheckoutContext } from "./checkoutTypes";

/**
 * Route element for `/checkout/*`. Owns wizard state and exposes it to step
 * routes via `useOutletContext`. Purchase mode is snapshotted at mount from
 * the cart — checkout does not react to live navbar/store changes.
 */
export default function CheckoutFlow() {
  const { user } = useAuth();
  const liveMode = usePurchaseMode();
  const [checkoutMode] = useState(() => liveMode);

  const { lines } = useCartView();

  const purchaseType = derivePurchaseType(checkoutMode, user?.company_id);
  const isB2bPurchase = purchaseType === "B2B";
  const useProfileBilling = isB2bPurchase;

  const selectedLines = useMemo(
    () =>
      lines.filter((l) => {
        if (!l.selected) return false;
        return cartEligibility(
          {
            id: l.product_id,
            name: l.name,
            slug: l.slug,
            sku: l.sku,
            base_price: String(l.base_price),
            stock_quantity: l.stock_quantity,
            main_image_url: l.main_image_url,
            is_b2b_only: l.is_b2b_only,
            is_active: l.is_active,
          },
          user?.company_id,
          l.quantity,
          checkoutMode,
        ).available;
      }),
    [lines, checkoutMode, user?.company_id],
  );

  const quoteItems = useMemo(
    () =>
      selectedLines.map((l) => ({
        product_id: l.product_id,
        quantity: l.quantity,
      })),
    [selectedLines],
  );

  const [addressId, setAddressId] = useState<string | null>(null);
  const [inlineAddress, setInlineAddress] = useState<AddressIn | null>(null);
  const [saveAddress, setSaveAddress] = useState(false);

  const methods = useForm<DetailsFormData>({
    resolver: zodResolver(detailsSchema),
    reValidateMode: "onBlur",
    defaultValues: {
      recipient: {
        recipient_name: user
          ? `${user.first_name} ${user.last_name}`.trim()
          : "",
        recipient_email: user?.email ?? "",
        recipient_phone: "",
      },
      billing: isB2bPurchase
        ? { ...emptyBillingValues, documentType: "COMPANY_INVOICE" }
        : emptyBillingValues,
    },
  });
  const { getValues, setValue, handleSubmit, control } = methods;
  const watchedValues = useWatch({ control });

  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>("COURIER");
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("BANK_TRANSFER");
  const [deliveryConfirmed, setDeliveryConfirmed] = useState(false);
  const [note, setNote] = useState("");

  const { data: personalAddresses = [] } = usePersonalAddresses();
  const { data: companyAddresses = [] } = useCompanyShippingAddresses();
  const { data: companyBillingAddress } = useCompanyBillingAddress();
  const { data: checkoutOptions } = useCheckoutOptions();

  const { data: quote } = useCartQuote(quoteItems, checkoutMode);
  const createOrder = useCreateOrder();

  const grandTotal = quote ? Number(quote.grand_total) : null;

  const shippingCost = Number(
    checkoutOptions?.delivery_methods.find(
      (d) => d.delivery_method === deliveryMethod,
    )?.cost ?? 0,
  );
  const orderTotal = grandTotal !== null ? grandTotal + shippingCost : null;

  const selectedAddress = isB2bPurchase
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
      setValue("billing.billingPostalCode", addr.postal_code, {
        shouldValidate: true,
      });
      setValue("billing.billingCountry", addr.country, {
        shouldValidate: true,
      });
    }
  }

  const hasShippingAddress = isB2bPurchase
    ? !!addressId
    : !!addressId || !!inlineAddress;
  const isDetailsValid = detailsSchema.safeParse(watchedValues).success;

  const canProceedToDelivery = isDetailsValid && hasShippingAddress;

  const canProceedToSummary =
    canProceedToDelivery &&
    !!deliveryMethod &&
    !!paymentMethod &&
    !(paymentMethod === "DEFERRED" && !isB2bPurchase);

  function submitOrder(data: DetailsFormData) {
    const payload: OrderCreate = {
      product_ids: selectedLines.map((l) => l.product_id),
      purchase_type: purchaseType,
      document: buildBillingDocumentIn(data.billing, useProfileBilling),
      ...(addressId ? { address_id: addressId } : {}),
      ...(!isB2bPurchase && inlineAddress
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

    checkoutMode,
    purchaseType,
    useProfileBilling,
    isB2bPurchase,

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
    <div className="w-full max-w-5xl mx-auto px-4 py-10">
      <CheckoutStepper />
      <FormProvider {...methods}>
        <Outlet context={checkoutCtx} />
      </FormProvider>
    </div>
  );
}
