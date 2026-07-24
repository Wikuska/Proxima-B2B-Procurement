import { useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Eye, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { ORDER_STATUS_LABELS, type OrderStatus } from "../../api/order";
import { avatarTone } from "../../utils/avatarTone";
import { getInitials } from "../../utils/getInitials";
import {
  ORDER_STATUS_STYLES,
  formatOrderDate,
  type OrdersTableRow,
} from "./types";

const PAGE_SIZE = 10;

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
}

export default function OrdersTable({
  orders,
  detailHref,
  showPlacedBy = false,
  emptyContent,
}: OrdersTableProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(0);

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

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageItems = filtered.slice(
    safePage * PAGE_SIZE,
    (safePage + 1) * PAGE_SIZE,
  );
  const from = filtered.length === 0 ? 0 : safePage * PAGE_SIZE + 1;
  const to = Math.min((safePage + 1) * PAGE_SIZE, filtered.length);

  const defaultEmpty =
    orders.length === 0 ? "No orders yet." : "No orders match your filters.";

  return (
    <div className="bg-bg-surface border border-border-base/30 rounded-xl overflow-hidden shadow-sm w-full">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center border-b border-border-base/20">
        <label className="relative flex-1 min-w-0">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search orders…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border-base/40 bg-bg-base text-text-main placeholder:text-text-muted focus:outline-none focus:border-border-focus"
          />
        </label>

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
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-text-muted">
          {emptyContent && orders.length === 0 ? (
            emptyContent
          ) : (
            <p className="text-sm">{defaultEmpty}</p>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed border-collapse min-w-[720px]">
              <thead>
                <tr className="bg-bg-base text-[11px] uppercase tracking-wider text-text-muted">
                  <th className="px-4 py-3 font-semibold text-left w-[12%]">
                    Order #
                  </th>
                  <th className="px-4 py-3 font-semibold text-center">Date</th>
                  {showPlacedBy && (
                    <th className="px-4 py-3 font-semibold text-center w-[22%]">
                      Ordered by
                    </th>
                  )}
                  <th className="px-4 py-3 font-semibold text-center">Items</th>
                  <th className="px-4 py-3 font-semibold text-center">
                    Amount
                  </th>
                  <th className="px-4 py-3 font-semibold text-center">
                    Status
                  </th>
                  <th className="px-4 py-3 font-semibold text-right w-[8%]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((order) => {
                  const name = placerLabel(order);
                  const initials = getInitials(name || "?");
                  return (
                    <tr
                      key={order.id}
                      className="border-t border-border-base/15 hover:bg-bg-base/80 transition-colors"
                    >
                      <td className="px-4 py-3.5 text-left">
                        <Link
                          to={detailHref(order.id)}
                          className="text-sm font-semibold font-mono text-text-main hover:text-primary"
                        >
                          #{order.id.slice(0, 8).toUpperCase()}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-text-muted whitespace-nowrap text-center">
                        {formatOrderDate(order.created_at)}
                      </td>
                      {showPlacedBy && (
                        <td className="px-4 py-3.5">
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
                      <td className="px-4 py-3.5 text-sm text-text-muted whitespace-nowrap text-center">
                        {order.item_count}{" "}
                        {order.item_count === 1 ? "item" : "items"}
                      </td>
                      <td className="px-4 py-3.5 text-sm font-semibold font-mono text-text-main whitespace-nowrap text-center">
                        ${Number(order.total_amount).toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-block text-[11px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-md ${
                            ORDER_STATUS_STYLES[order.status] ??
                            "bg-border-base/20 text-text-main"
                          }`}
                        >
                          {ORDER_STATUS_LABELS[order.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
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
          </div>

          <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-border-base/20">
            <p className="text-xs text-text-muted">
              Showing {from}–{to} of {filtered.length} orders
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={safePage <= 0}
                onClick={() => setPage(safePage - 1)}
                className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-border-base/40 text-text-muted hover:bg-bg-base disabled:opacity-40 disabled:pointer-events-none"
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                disabled={safePage >= pageCount - 1}
                onClick={() => setPage(safePage + 1)}
                className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-border-base/40 text-text-muted hover:bg-bg-base disabled:opacity-40 disabled:pointer-events-none"
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
