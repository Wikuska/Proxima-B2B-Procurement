import { useParams } from "react-router-dom";
import OrderDetailView from "../../components/orders/OrderDetailView";
import {
  useAdminOrder,
  useAdvanceAdminOrderStatus,
} from "../../hooks/admin/useAdminOrders";

const ADVANCE_LABEL: Partial<Record<string, string>> = {
  PREPARING: "Mark as shipped",
  SHIPPED: "Mark as delivered",
};

export default function AdminOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { data: order, isLoading, isError } = useAdminOrder(orderId);
  const advance = useAdvanceAdminOrderStatus(orderId ?? "");

  if (isLoading) return <p className="text-sm text-text-muted">Loading…</p>;
  if (isError || !order)
    return <p className="text-sm text-red-500">Order not found.</p>;

  const name =
    `${order.placed_by.first_name} ${order.placed_by.last_name}`.trim() ||
    order.placed_by.email;

  const advanceLabel = ADVANCE_LABEL[order.status];

  return (
    <OrderDetailView
      order={order}
      backTo={{ href: "/admin/orders", label: "Back to orders" }}
      placedBy={{ name, email: order.placed_by.email }}
      companyName={order.company_name}
      layout="wide"
      actions={
        advanceLabel ? (
          <button
            type="button"
            disabled={advance.isPending}
            onClick={() => advance.mutate()}
            className="inline-flex px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-accent transition-colors disabled:opacity-60"
          >
            {advance.isPending ? "Updating…" : advanceLabel}
          </button>
        ) : undefined
      }
    />
  );
}
