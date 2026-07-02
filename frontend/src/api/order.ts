import apiFetch from "./client";
import type { AddressIn } from "./address";

export type PurchaseType = "B2B" | "B2C";
export type DocumentType = "RECEIPT" | "PERSONAL_INVOICE" | "COMPANY_INVOICE";
export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED";

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

export interface OrderItemOut {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: string;
  discount_percentage: string;
}

export interface OrderOut {
  id: string;
  status: OrderStatus;
  purchase_type: PurchaseType;
  total_amount: string;
  created_at: string;
  shipping_street: string;
  shipping_city: string;
  shipping_postal_code: string;
  shipping_country: string;
  billing_document: BillingDocumentOut;
  items: OrderItemOut[];
}

export interface OrderSummaryOut {
  id: string;
  status: OrderStatus;
  purchase_type: PurchaseType;
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
}

export const createOrder = (data: OrderCreate): Promise<OrderOut> =>
  apiFetch<OrderOut>("/orders", { method: "POST", body: data });

export const getOrders = (purchaseType?: PurchaseType): Promise<OrderSummaryOut[]> => {
  const qs = purchaseType ? `?purchase_type=${purchaseType}` : "";
  return apiFetch<OrderSummaryOut[]>(`/orders${qs}`);
};

export const getOrder = (id: string): Promise<OrderOut> =>
  apiFetch<OrderOut>(`/orders/${id}`);
