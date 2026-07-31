import OrdersTable from "../../components/orders/OrdersTable";
import type { OrdersTableRow } from "../../components/orders/types";
import { useAdminOrders } from "../../hooks/admin/useAdminOrders";

export default function AdminOrdersTab() {
  const { data: orders, isLoading, isError } = useAdminOrders();

  if (isLoading)
    return <p className="text-sm text-text-muted">Loading orders…</p>;
  if (isError)
    return <p className="text-sm text-red-500">Failed to load orders.</p>;

  const rows: OrdersTableRow[] = (orders ?? []).map((order) => ({
    id: order.id,
    created_at: order.created_at,
    item_count: order.item_count,
    total_amount: order.total_amount,
    status: order.status,
    placed_by: order.placed_by,
    company_name: order.company_name,
  }));

  return (
    <div className="space-y-4 w-full">
      <div>
        <h2 className="text-3xl font-bold text-text-main mb-2 tracking-tight">
          Orders
        </h2>
        <p className="text-text-muted mb-5">
          All platform orders — advance fulfillment from PREPARING to DELIVERED.
        </p>
      </div>

      <OrdersTable
        orders={rows}
        detailHref={(id) => `/admin/orders/${id}`}
        showPlacedBy
        showCompany
        emptyContent={<p className="text-sm">No orders yet.</p>}
      />
    </div>
  );
}
