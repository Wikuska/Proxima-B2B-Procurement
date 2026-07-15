import { useState } from "react";
import { Link } from "react-router-dom";
import { useOrders } from "../../hooks/order/useOrders";
import { useAuth } from "../../hooks/user/useAuth";
import type { PurchaseType, OrderSummaryOut } from "../../api/order";
import { ORDER_STATUS_LABELS } from "../../api/order";

const STATUS_STYLES: Record<string, string> = {
  PENDING_PAYMENT: "bg-yellow-500/10 text-yellow-600 border border-yellow-500/20",
  PAID: "bg-green-500/10 text-green-600 border border-green-500/20",
  PROCESSING: "bg-blue-500/10 text-blue-600 border border-blue-500/20",
  SHIPPED: "bg-indigo-500/10 text-indigo-600 border border-indigo-500/20",
  DELIVERED: "bg-green-600/10 text-green-700 border border-green-600/20",
  CANCELLED: "bg-red-500/10 text-red-500 border border-red-500/20",
  RETURNED: "bg-gray-500/10 text-gray-500 border border-gray-500/20",
};

function OrderList({ orders }: { orders: OrderSummaryOut[] }) {
  if (!orders.length) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-bg-base border border-dashed border-border-base/40 rounded-lg text-text-muted">
        <p className="text-sm">No orders yet.</p>
        <Link to="/catalog" className="mt-3 text-sm text-primary hover:underline">
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <Link
          key={order.id}
          to={`/profile/orders/${order.id}`}
          className="flex items-center justify-between p-4 bg-bg-base border border-border-base/40 rounded-lg shadow-sm hover:border-accent transition-colors"
        >
          <div>
            <p className="text-sm font-semibold text-text-main">
              #{order.id.slice(0, 8).toUpperCase()}
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              {new Date(order.created_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}{" "}
              · {order.item_count} {order.item_count === 1 ? "item" : "items"} ·{" "}
              {order.purchase_type === "B2B" ? "Invoice" : "Receipt"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold font-mono text-text-main">
              ${Number(order.total_amount).toFixed(2)}
            </span>
            <span
              className={`text-[11px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full ${
                STATUS_STYLES[order.status] ?? "bg-border-base/20 text-text-main"
              }`}
            >
              {ORDER_STATUS_LABELS[order.status]}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function OrdersTab() {
  const { user } = useAuth();
  const hasCompany = !!user?.company_id;

  const [segment, setSegment] = useState<PurchaseType>("B2C");
  const activeFilter: PurchaseType | undefined = hasCompany ? segment : undefined;

  const { data: orders, isLoading, isError } = useOrders(activeFilter);

  if (isLoading) return <p className="text-sm text-text-muted">Loading orders…</p>;
  if (isError) return <p className="text-sm text-red-500">Failed to load orders.</p>;

  return (
    <div className="space-y-5">
      {/* Segmented control — only shown for company members */}
      {hasCompany && (
        <div className="inline-flex rounded-md border border-border-base/30 bg-bg-surface overflow-hidden text-sm">
          {(["B2C", "B2B"] as PurchaseType[]).map((type) => (
            <button
              key={type}
              onClick={() => setSegment(type)}
              className={`px-5 py-2 font-medium transition-colors ${
                segment === type
                  ? "bg-primary text-white"
                  : "text-text-muted hover:text-text-main"
              }`}
            >
              {type === "B2C" ? "Private" : "Company"}
            </button>
          ))}
        </div>
      )}

      <OrderList orders={orders ?? []} />
    </div>
  );
}
