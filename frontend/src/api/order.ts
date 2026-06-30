import apiFetch from "./client";
import type { AddressIn } from "./address";

export type PurchaseType = "B2B" | "B2C";
export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED";

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
  billing_nip: string | null;
  billing_company_name: string | null;
  shipping_street: string;
  shipping_city: string;
  shipping_postal_code: string;
  shipping_country: string;
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
  address_id?: string;
  shipping_address?: AddressIn;
  save_address?: boolean;
}

export const createOrder = (data: OrderCreate): Promise<OrderOut> =>
  apiFetch<OrderOut>("/orders", { method: "POST", body: data });

export const getOrders = (): Promise<OrderSummaryOut[]> =>
  apiFetch<OrderSummaryOut[]>("/orders");

export const getOrder = (id: string): Promise<OrderOut> =>
  apiFetch<OrderOut>(`/orders/${id}`);
