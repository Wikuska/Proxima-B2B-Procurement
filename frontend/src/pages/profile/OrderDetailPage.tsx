import { useParams } from "react-router-dom";
import OrderDetailView from "../../components/orders/OrderDetailView";
import { useOrder } from "../../hooks/order/useOrders";

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { data: order, isLoading, isError } = useOrder(orderId ?? "");

  if (isLoading) return <p className="text-sm text-text-muted">Loading…</p>;
  if (isError || !order) return <p className="text-sm text-red-500">Order not found.</p>;

  return (
    <OrderDetailView
      order={order}
      backTo={{ href: "/profile/orders", label: "Back to orders" }}
      showOwnerPaymentActions
    />
  );
}
