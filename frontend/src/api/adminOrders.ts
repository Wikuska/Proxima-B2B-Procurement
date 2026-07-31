import apiFetch from "./client";
import type {
  BillingDocumentOut,
  OrderItemOut,
  OrderStatus,
  PaymentMethod,
  PurchaseType,
  ShipmentOut,
} from "./order";

export interface AdminOrderPlacer {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface AdminOrderSummary {
  id: string;
  status: OrderStatus;
  purchase_type: PurchaseType;
  company_id: string | null;
  company_name: string | null;
  total_amount: string;
  created_at: string;
  item_count: number;
  placed_by: AdminOrderPlacer;
}

export interface AdminOrderDetails {
  id: string;
  status: OrderStatus;
  purchase_type: PurchaseType;
  company_id: string | null;
  company_name: string | null;
  payment_method: PaymentMethod;
  total_amount: string;
  note: string | null;
  created_at: string;
  billing_document: BillingDocumentOut;
  shipment: ShipmentOut;
  items: OrderItemOut[];
  placed_by: AdminOrderPlacer;
}

export const fetchAdminOrders = (
  status?: OrderStatus,
  signal?: AbortSignal,
) => {
  const qs = status ? `?status=${status}` : "";
  return apiFetch<AdminOrderSummary[]>(`/admin/orders${qs}`, { signal });
};

export const fetchAdminOrder = (orderId: string, signal?: AbortSignal) =>
  apiFetch<AdminOrderDetails>(`/admin/orders/${orderId}`, { signal });

export const advanceAdminOrderStatus = (orderId: string) =>
  apiFetch<AdminOrderDetails>(`/admin/orders/${orderId}/advance-status`, {
    method: "POST",
  });
