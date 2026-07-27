import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { ORDER_STATUS_LABELS, type OrderStatus } from "../../api/order";
import DataTableShell, {
  DataTableSearch,
  TablePagination,
  dataTableClass,
  dataTableHeadRowClass,
  dataTableRowClass,
  dataTableTdClass,
  dataTableThClass,
  paginateRows,
} from "../common/DataTableShell";
import { avatarTone } from "../../utils/avatarTone";
import { getInitials } from "../../utils/getInitials";
import {
  ORDER_STATUS_STYLES,
  formatOrderDate,
  type OrdersTableRow,
} from "./types";

const ALL_STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

function placerLabel(row: OrdersTableRow): string {
  if (!row.placed_by) return "";
  const { first_name, last_name, email } = row.placed_by;
  const name = `${first_name} ${last_name}`.trim();
  return name || email;
}

function toDateInputValue(iso: string): string {
  return iso.slice(0, 10);
}

export interface OrdersTableProps {
  orders: OrdersTableRow[];
  detailHref: (orderId: string) => string;
  showPlacedBy?: boolean;
  emptyContent?: ReactNode;
  initialStatus?: OrderStatus | "";
}

export default function OrdersTable({
  orders,
  detailHref,
  showPlacedBy = false,
  emptyContent,
  initialStatus = "",
}: OrdersTableProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<OrderStatus | "">(initialStatus);
  const [date, setDate] = useState("");
  const [page, setPage] = useState(0);

  useEffect(() => {
    setStatus(initialStatus);
    setPage(0);
  }, [initialStatus]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((order) => {
      if (status && order.status !== status) return false;
      if (date && toDateInputValue(order.created_at) !== date) return false;
      if (!q) return true;
      const id = order.id.toLowerCase();
      const shortId = order.id.slice(0, 8).toLowerCase();
      const placer = placerLabel(order).toLowerCase();
      const email = order.placed_by?.email.toLowerCase() ?? "";
      return (
        placer.includes(q) ||
        email.includes(q) ||
        id.includes(q) ||
        shortId.includes(q) ||
        `#${shortId}`.includes(q)
      );
    });
  }, [orders, search, status, date]);

  const { pageItems, pageCount, safePage, from, to } = paginateRows(
    filtered,
    page,
  );

  const isEmpty = filtered.length === 0;
  const emptyNode =
    emptyContent && orders.length === 0 ? (
      emptyContent
    ) : (
      <p className="text-sm">
        {orders.length === 0
          ? "No orders yet."
          : "No orders match your filters."}
      </p>
    );

  return (
    <DataTableShell
      toolbar={
        <>
          <DataTableSearch
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(0);
            }}
            placeholder="Search orders…"
          />
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as OrderStatus | "");
              setPage(0);
            }}
            className="sm:w-48 px-3 py-2 text-sm rounded-lg border border-border-base/40 bg-bg-base text-text-main focus:outline-none focus:border-border-focus"
            aria-label="Filter by status"
          >
            <option value="">Status: All</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setPage(0);
            }}
            className="sm:w-44 px-3 py-2 text-sm rounded-lg border border-border-base/40 bg-bg-base text-text-main focus:outline-none focus:border-border-focus"
            aria-label="Filter by date"
          />
        </>
      }
      isEmpty={isEmpty}
      emptyContent={emptyNode}
      footer={
        <TablePagination
          from={from}
          to={to}
          total={filtered.length}
          noun="orders"
          page={safePage}
          pageCount={pageCount}
          onPageChange={setPage}
        />
      }
    >
      <table className={dataTableClass}>
        <thead>
          <tr className={dataTableHeadRowClass}>
            <th className={`${dataTableThClass} text-left w-[12%]`}>Order #</th>
            <th className={`${dataTableThClass} text-center`}>Date</th>
            {showPlacedBy && (
              <th className={`${dataTableThClass} text-center w-[22%]`}>
                Ordered by
              </th>
            )}
            <th className={`${dataTableThClass} text-center`}>Items</th>
            <th className={`${dataTableThClass} text-center`}>Amount</th>
            <th className={`${dataTableThClass} text-center`}>Status</th>
            <th className={`${dataTableThClass} text-right w-[8%]`}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {pageItems.map((order) => {
            const name = placerLabel(order);
            const initials = getInitials(name || "?");
            return (
              <tr key={order.id} className={dataTableRowClass}>
                <td className={`${dataTableTdClass} text-left`}>
                  <Link
                    to={detailHref(order.id)}
                    className="text-sm font-semibold font-mono text-text-main hover:text-primary"
                  >
                    #{order.id.slice(0, 8).toUpperCase()}
                  </Link>
                </td>
                <td
                  className={`${dataTableTdClass} text-sm text-text-muted whitespace-nowrap text-center`}
                >
                  {formatOrderDate(order.created_at)}
                </td>
                {showPlacedBy && (
                  <td className={dataTableTdClass}>
                    <div className="flex items-center justify-center gap-2.5 min-w-0">
                      <span
                        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold ${avatarTone(order.placed_by?.id ?? order.id)}`}
                        aria-hidden
                      >
                        {initials}
                      </span>
                      <div className="min-w-0 text-left">
                        <p className="text-sm font-medium text-text-main truncate">
                          {name}
                        </p>
                        <p className="text-xs text-text-muted truncate">
                          {order.placed_by?.email}
                        </p>
                      </div>
                    </div>
                  </td>
                )}
                <td
                  className={`${dataTableTdClass} text-sm text-text-muted whitespace-nowrap text-center`}
                >
                  {order.item_count}{" "}
                  {order.item_count === 1 ? "item" : "items"}
                </td>
                <td
                  className={`${dataTableTdClass} text-sm font-semibold font-mono text-text-main whitespace-nowrap text-center`}
                >
                  ${Number(order.total_amount).toFixed(2)}
                </td>
                <td className={`${dataTableTdClass} text-center`}>
                  <span
                    className={`inline-block text-[11px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-md ${
                      ORDER_STATUS_STYLES[order.status] ??
                      "bg-border-base/20 text-text-main"
                    }`}
                  >
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </td>
                <td className={`${dataTableTdClass} text-right`}>
                  <Link
                    to={detailHref(order.id)}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-md text-text-muted hover:text-primary hover:bg-primary/5 transition-colors"
                    aria-label={`View order ${order.id.slice(0, 8)}`}
                    title="View order"
                  >
                    <Eye size={16} />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </DataTableShell>
  );
}
