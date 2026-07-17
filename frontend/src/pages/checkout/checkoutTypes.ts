import type { AddressIn, AddressOut } from "../../api/address";
import type {
  CheckoutOptionsOut,
  DeliveryMethod,
  PaymentMethod,
  PurchaseType,
} from "../../api/order";
import type { useCartQuote } from "../../hooks/pricing/useCartQuote";
import type { useCartView } from "../../hooks/cart/useCartView";
import type { PurchaseMode } from "../../store/purchaseModeStore";

export interface CheckoutContext {
  // Cart / pricing
  selectedLines: ReturnType<typeof useCartView>["lines"];
  quote: ReturnType<typeof useCartQuote>["data"];
  grandTotal: number | null;

  // Checkout options (delivery costs, payment b2b_only flags)
  checkoutOptions: CheckoutOptionsOut | undefined;
  shippingCost: number;
  orderTotal: number | null;

  // Frozen purchase mode from cart entry (read-only in checkout)
  checkoutMode: PurchaseMode;
  purchaseType: PurchaseType;
  useProfileBilling: boolean;
  isB2bPurchase: boolean;

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
  deliveryConfirmed: boolean;
  setDeliveryConfirmed: (v: boolean) => void;

  copyRecipientToBilling: () => void;

  note: string;
  setNote: (v: string) => void;

  isDetailsValid: boolean;
  hasShippingAddress: boolean;
  canProceedToDelivery: boolean;
  canProceedToSummary: boolean;

  handlePlaceOrder: () => void;
  isPlacingOrder: boolean;
}
