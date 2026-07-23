import { X } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import OrdersTable from "../../components/orders/OrdersTable";
import type { OrdersTableRow } from "../../components/orders/types";
import { useCompanyMembers } from "../../hooks/company/requests";
import { useCompanyOrders } from "../../hooks/company/useCompanyOrders";

export default function CompanyOrdersTab() {
  const [searchParams] = useSearchParams();
  const memberId = searchParams.get("member");

  const { data: orders, isLoading, isError } = useCompanyOrders();
  const { data: members } = useCompanyMembers();

  if (isLoading)
    return <p className="text-sm text-text-muted">Loading orders…</p>;
  if (isError)
    return <p className="text-sm text-red-500">Failed to load orders.</p>;

  const memberFilter = memberId
    ? members?.find((m) => m.id === memberId)
    : undefined;
  const memberLabel = memberFilter
    ? `${memberFilter.first_name} ${memberFilter.last_name}`.trim() ||
      memberFilter.email
    : null;

  const rows: OrdersTableRow[] = (orders ?? [])
    .filter((order) => !memberId || order.placed_by.id === memberId)
    .map((order) => ({
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

      {memberId && (
        <div className="inline-flex items-center gap-2 rounded-lg border border-border-base/30 bg-bg-surface px-3 py-2 text-sm">
          <span className="text-text-muted">Ordered by</span>
          <span className="font-medium text-text-main">
            {memberLabel ?? "selected member"}
          </span>
          <Link
            to="/company/orders"
            className="inline-flex items-center justify-center w-6 h-6 rounded-md text-text-muted hover:text-primary hover:bg-primary/5"
            aria-label="Clear member filter"
            title="Clear filter"
          >
            <X size={14} />
          </Link>
        </div>
      )}

      <OrdersTable
        orders={rows}
        detailHref={(id) => `/company/orders/${id}`}
        showPlacedBy
        emptyContent={
          <p className="text-sm">
            {memberId
              ? "No company orders from this member."
              : "No company orders yet."}
          </p>
        }
      />
    </div>
  );
}
