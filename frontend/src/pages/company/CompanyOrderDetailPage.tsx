import { useParams } from "react-router-dom";
import OrderDetailView from "../../components/orders/OrderDetailView";
import { useCompanyOrder } from "../../hooks/company/useCompanyOrders";

export default function CompanyOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { data: order, isLoading, isError } = useCompanyOrder(orderId ?? "");

  if (isLoading) return <p className="text-sm text-text-muted">Loading…</p>;
  if (isError || !order) return <p className="text-sm text-red-500">Order not found.</p>;

  const name =
    `${order.placed_by.first_name} ${order.placed_by.last_name}`.trim() ||
    order.placed_by.email;

  return (
    <OrderDetailView
      order={order}
      backTo={{ href: "/company/orders", label: "Back to company orders" }}
      placedBy={{ name, email: order.placed_by.email }}
      layout="wide"
    />
  );
}
