import apiFetch from "./client";
import type { AddressIn } from "./address";

export type PurchaseType = "B2B" | "B2C";
export type DocumentType = "RECEIPT" | "PERSONAL_INVOICE" | "COMPANY_INVOICE";
export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PREPARING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED";
export type DeliveryMethod =
  | "COURIER"
  | "COURIER_EXPRESS"
  | "INPOST_LOCKER"
  | "PICKUP";
export type PaymentMethod =
  | "BANK_TRANSFER"
  | "CARD"
  | "BLIK"
  | "CASH_ON_DELIVERY"
  | "DEFERRED";

export interface BillingDocumentIn {
  document_type: DocumentType;
  company_name?: string;
  company_nip?: string;
  first_name?: string;
  last_name?: string;
  billing_street?: string;
  billing_city?: string;
  billing_postal_code?: string;
  billing_country?: string;
}

export interface BillingDocumentOut {
  id: string;
  document_type: DocumentType;
  document_number: string | null;
  company_name: string | null;
  company_nip: string | null;
  first_name: string | null;
  last_name: string | null;
  billing_street: string | null;
  billing_city: string | null;
  billing_postal_code: string | null;
  billing_country: string | null;
  pdf_url: string | null;
  issued_at: string | null;
  created_at: string;
}

export interface ShipmentOut {
  delivery_method: DeliveryMethod;
  shipping_cost: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_email: string | null;
  shipping_street: string;
  shipping_city: string;
  shipping_postal_code: string;
  shipping_country: string;
  created_at: string;
}

export interface OrderItemOut {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  product_slug: string | null;
  quantity: number;
  unit_price: string;
  discount_percentage: string;
}

export interface OrderOut {
  id: string;
  status: OrderStatus;
  purchase_type: PurchaseType;
  company_id: string | null;
  payment_method: PaymentMethod;
  total_amount: string;
  note: string | null;
  created_at: string;
  billing_document: BillingDocumentOut;
  shipment: ShipmentOut;
  items: OrderItemOut[];
}

export interface OrderSummaryOut {
  id: string;
  status: OrderStatus;
  purchase_type: PurchaseType;
  company_id: string | null;
  total_amount: string;
  created_at: string;
  item_count: number;
}

export interface OrderCreate {
  product_ids: string[];
  purchase_type: PurchaseType;
  document: BillingDocumentIn;
  address_id?: string;
  shipping_address?: AddressIn;
  save_address?: boolean;
  delivery_method: DeliveryMethod;
  payment_method: PaymentMethod;
  recipient_name: string;
  recipient_phone: string;
  recipient_email?: string;
  note?: string;
}

export interface DeliveryOptionOut {
  delivery_method: DeliveryMethod;
  cost: string;
}

export interface PaymentOptionOut {
  payment_method: PaymentMethod;
  b2b_only: boolean;
}

export interface CheckoutOptionsOut {
  delivery_methods: DeliveryOptionOut[];
  payment_methods: PaymentOptionOut[];
}

export const DELIVERY_LABELS: Record<DeliveryMethod, string> = {
  COURIER: "Courier",
  COURIER_EXPRESS: "Courier (Express)",
  INPOST_LOCKER: "InPost Locker",
  PICKUP: "Personal pickup",
};

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  BANK_TRANSFER: "Bank transfer",
  CARD: "Credit / debit card",
  BLIK: "BLIK",
  CASH_ON_DELIVERY: "Cash on delivery",
  DEFERRED: "Deferred payment (invoice)",
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Awaiting payment",
  PREPARING: "Preparing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};

export const createOrder = (data: OrderCreate): Promise<OrderOut> =>
  apiFetch<OrderOut>("/orders", { method: "POST", body: data });

export const getOrders = (purchaseType?: PurchaseType): Promise<OrderSummaryOut[]> => {
  const qs = purchaseType ? `?purchase_type=${purchaseType}` : "";
  return apiFetch<OrderSummaryOut[]>(`/orders${qs}`);
};

export const getOrder = (id: string): Promise<OrderOut> =>
  apiFetch<OrderOut>(`/orders/${id}`);

export const getCheckoutOptions = (): Promise<CheckoutOptionsOut> =>
  apiFetch<CheckoutOptionsOut>("/orders/checkout-options");

export const mockPayment = (orderId: string, success: boolean): Promise<OrderOut> =>
  apiFetch<OrderOut>(`/orders/${orderId}/payment/mock`, {
    method: "POST",
    body: { success },
  });

export const confirmPayment = (orderId: string): Promise<OrderOut> =>
  apiFetch<OrderOut>(`/orders/${orderId}/payment/confirm`, { method: "POST" });

export const advanceOrderStatus = (orderId: string): Promise<OrderOut> =>
  apiFetch<OrderOut>(`/orders/${orderId}/advance-status`, { method: "POST" });
