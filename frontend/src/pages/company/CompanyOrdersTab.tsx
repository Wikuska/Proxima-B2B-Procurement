import OrdersTable from "../../components/orders/OrdersTable";
import type { OrdersTableRow } from "../../components/orders/types";
import { useCompanyOrders } from "../../hooks/company/useCompanyOrders";

export default function CompanyOrdersTab() {
  const { data: orders, isLoading, isError } = useCompanyOrders();

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
  }));

  return (
    <div className="space-y-4 w-full">
      <div>
        <h2 className="text-3xl font-bold text-text-main mb-2 tracking-tight">
          Company orders
        </h2>
        <p className="text-text-muted mb-5">
          B2B orders placed by members of your company.
        </p>
      </div>

      <OrdersTable
        orders={rows}
        detailHref={(id) => `/company/orders/${id}`}
        showPlacedBy
        emptyContent={<p className="text-sm">No company orders yet.</p>}
      />
    </div>
  );
}
