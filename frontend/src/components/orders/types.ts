import type {
  BillingDocumentOut,
  OrderItemOut,
  OrderStatus,
  PaymentMethod,
  PurchaseType,
  ShipmentOut,
} from "../../api/order";

/** Shared order detail payload (profile + company admin). */
export interface OrderDetailData {
  id: string;
  status: OrderStatus;
  purchase_type: PurchaseType;
  payment_method: PaymentMethod;
  total_amount: string;
  note: string | null;
  created_at: string;
  billing_document: BillingDocumentOut;
  shipment: ShipmentOut;
  items: OrderItemOut[];
}

export interface OrderPlacerInfo {
  name: string;
  email: string;
}

export interface OrdersTableRow {
  id: string;
  created_at: string;
  item_count: number;
  total_amount: string;
  status: OrderStatus;
  placed_by?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  company_name?: string | null;
}

export const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "bg-yellow-500/10 text-yellow-700 border border-yellow-500/20",
  PREPARING: "bg-accent/15 text-primary border border-accent/25",
  SHIPPED: "bg-indigo-500/10 text-indigo-700 border border-indigo-500/20",
  DELIVERED: "bg-border-base/15 text-text-main border border-border-base/25",
  CANCELLED: "bg-red-500/10 text-red-600 border border-red-500/20",
  RETURNED: "bg-border-base/15 text-text-muted border border-border-base/25",
};

export function formatOrderDate(
  iso: string,
  style: "short" | "long" = "short",
): string {
  return new Date(iso).toLocaleDateString(
    "en-GB",
    style === "long"
      ? { day: "numeric", month: "long", year: "numeric" }
      : { day: "numeric", month: "short", year: "numeric" },
  );
}
