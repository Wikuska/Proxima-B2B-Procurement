import { CheckCircle } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useOrder } from "../../hooks/order/useOrders";

export default function CheckoutConfirmationPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { data: order, isLoading } = useOrder(orderId ?? "");

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center text-text-muted">
        Loading…
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center text-text-muted">
        Order not found.
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-14 text-center">
      <CheckCircle className="mx-auto mb-5 text-green-500" size={56} strokeWidth={1.5} />
      <h1 className="text-2xl font-bold text-text-main mb-2">Order placed!</h1>
      <p className="text-sm text-text-muted mb-6">
        Order #{order.id.slice(0, 8).toUpperCase()} · Total ${Number(order.total_amount).toFixed(2)}
      </p>

      <div className="bg-bg-surface border border-border-base/20 rounded-2xl p-6 text-left shadow-sm mb-8">
        <h2 className="text-sm font-semibold text-text-main mb-3">Items ordered</h2>
        <div className="divide-y divide-border-base/10">
          {order.items.map((item) => (
            <div key={item.id} className="py-2.5 flex justify-between gap-4">
              <div>
                <p className="text-sm text-text-main">{item.product_name}</p>
                <p className="text-xs text-text-muted">
                  {item.product_sku} · qty {item.quantity}
                </p>
              </div>
              <p className="text-sm font-mono text-text-main whitespace-nowrap">
                ${(Number(item.unit_price) * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
        <div className="border-t border-border-base/10 mt-3 pt-3 flex justify-between">
          <span className="text-sm font-bold text-text-main">Total</span>
          <span className="text-sm font-bold font-mono text-text-main">
            ${Number(order.total_amount).toFixed(2)}
          </span>
        </div>
      </div>

      <div className="flex gap-3 justify-center">
        <Link
          to={`/profile/orders/${order.id}`}
          className="px-6 py-2.5 border border-primary text-primary rounded-lg text-sm font-semibold hover:bg-primary hover:text-white transition-colors"
        >
          View Order
        </Link>
        <Link
          to="/catalog"
          className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-accent transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
