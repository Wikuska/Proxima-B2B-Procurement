import { useState } from "react";
import { Link } from "react-router-dom";
import OrdersTable from "../../components/orders/OrdersTable";
import type { OrdersTableRow } from "../../components/orders/types";
import { useOrders } from "../../hooks/order/useOrders";
import { useAuth } from "../../hooks/user/useAuth";
import type { PurchaseType } from "../../api/order";

export default function OrdersTab() {
  const { user } = useAuth();
  const hasCompany = !!user?.company_id;

  const [segment, setSegment] = useState<PurchaseType>("B2C");
  const activeFilter: PurchaseType | undefined = hasCompany ? segment : undefined;

  const { data: orders, isLoading, isError } = useOrders(activeFilter);

  if (isLoading) return <p className="text-sm text-text-muted">Loading orders…</p>;
  if (isError) return <p className="text-sm text-red-500">Failed to load orders.</p>;

  const rows: OrdersTableRow[] = (orders ?? []).map((order) => ({
    id: order.id,
    created_at: order.created_at,
    item_count: order.item_count,
    total_amount: order.total_amount,
    status: order.status,
  }));

  return (
    <div className="space-y-5 w-full">
      {hasCompany && (
        <div className="inline-flex rounded-md border border-border-base/30 bg-bg-surface overflow-hidden text-sm">
          {(["B2C", "B2B"] as PurchaseType[]).map((type) => (
            <button
              key={type}
              type="button"
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

      <OrdersTable
        orders={rows}
        detailHref={(id) => `/profile/orders/${id}`}
        emptyContent={
          <>
            <p className="text-sm">No orders yet.</p>
            <Link to="/catalog" className="mt-3 text-sm text-primary hover:underline">
              Start shopping
            </Link>
          </>
        }
      />
    </div>
  );
}
