import type { AddressIn, AddressOut } from "../../api/address";
import type {
  CheckoutOptionsOut,
  DeliveryMethod,
  PaymentMethod,
  PurchaseType,
} from "../../api/order";
import type { useCartQuote } from "../../hooks/pricing/useCartQuote";
import type { useCartView } from "../../hooks/cart/useCartView";

export interface CheckoutContext {
  // Cart / pricing
  selectedLines: ReturnType<typeof useCartView>["lines"];
  quote: ReturnType<typeof useCartQuote>["data"];
  grandTotal: number | null;

  // Checkout options (delivery costs, payment b2b_only flags)
  checkoutOptions: CheckoutOptionsOut | undefined;
  shippingCost: number;
  orderTotal: number | null;

  // Purchase type
  purchaseType: PurchaseType;
  effectivePurchaseType: PurchaseType;
  isCompanyMode: boolean;
  hasB2B: boolean;
  hasCompany: boolean;
  hasB2bSelected: boolean;
  b2bBlockedNoCompany: boolean;
  changePurchaseType: (type: PurchaseType) => void;

  // Shipping address
  personalAddresses: AddressOut[];
  companyAddresses: AddressOut[];
  companyBillingAddress: AddressOut | null | undefined;
  addressId: string | null;
  setAddressId: (id: string | null) => void;
  inlineAddress: AddressIn | null;
  setInlineAddress: (data: AddressIn | null) => void;
  saveAddress: boolean;
  setSaveAddress: (save: boolean) => void;
  selectedAddress: AddressOut | undefined;

  // Delivery & payment
  deliveryMethod: DeliveryMethod;
  setDeliveryMethod: (v: DeliveryMethod) => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (v: PaymentMethod) => void;
  // True once the user has reached the delivery step at least once — lets the
  // order summary on step 1 keep showing the shipping cost after going back,
  // instead of resetting to "not yet chosen".
  deliveryConfirmed: boolean;
  setDeliveryConfirmed: (v: boolean) => void;

  // Recipient + billing document form (owned by the shared react-hook-form
  // instance in CheckoutFlow, see <FormProvider>/useFormContext<DetailsFormData>).
  copyRecipientToBilling: () => void;

  // Order note
  note: string;
  setNote: (v: string) => void;

  // Derived guards
  isDetailsValid: boolean;
  hasShippingAddress: boolean;
  canProceedToDelivery: boolean;
  canProceedToSummary: boolean;

  // Submission
  handlePlaceOrder: () => void;
  isPlacingOrder: boolean;
}
