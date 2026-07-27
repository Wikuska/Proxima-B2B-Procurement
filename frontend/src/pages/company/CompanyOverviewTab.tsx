import { useMemo, type ReactNode } from "react";
import { Eye, Package, Percent, UserPlus, Users } from "lucide-react";
import { Link } from "react-router-dom";
import type { OrderStatus } from "../../api/order";
import { ORDER_STATUS_LABELS } from "../../api/order";
import Panel from "../../components/common/Panel";
import {
  dataTableClass,
  dataTableHeadRowClass,
  dataTableRowClass,
  dataTableTdClass,
  dataTableThClass,
} from "../../components/common/DataTableShell";
import {
  ORDER_STATUS_STYLES,
  formatOrderDate,
} from "../../components/orders/types";
import {
  useCompanyMembers,
  useCompanySettings,
  usePendingCompanyRequests,
} from "../../hooks/company/requests";
import { useCompanyOrders } from "../../hooks/company/useCompanyOrders";

const OPEN_STATUSES: OrderStatus[] = [
  "PENDING_PAYMENT",
  "PREPARING",
  "SHIPPED",
];

const PIPELINE_STATUSES: OrderStatus[] = [
  "PENDING_PAYMENT",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
];

const EXCEPTION_STATUSES: OrderStatus[] = ["CANCELLED", "RETURNED"];

const PIPELINE_TILE_STATUSES: OrderStatus[] = [
  ...PIPELINE_STATUSES,
  ...EXCEPTION_STATUSES,
];

const OPEN_STATUS_PRIORITY: Partial<Record<OrderStatus, number>> = {
  PENDING_PAYMENT: 0,
  PREPARING: 1,
  SHIPPED: 2,
};

function formatNip(nip: string) {
  const cleaned = nip.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 8)}-${cleaned.slice(8, 10)}`;
  }
  return nip;
}

function sumAmounts(orders: { total_amount: string }[]) {
  return orders.reduce((acc, o) => acc + Number(o.total_amount), 0);
}

function placerName(order: {
  placed_by: { first_name: string; last_name: string; email: string };
}) {
  const name =
    `${order.placed_by.first_name} ${order.placed_by.last_name}`.trim();
  return name || order.placed_by.email;
}

interface KpiCardProps {
  label: string;
  value: string;
  hint?: string;
  highlight?: boolean;
  to?: string;
  icon: ReactNode;
}

function KpiCard({ label, value, hint, highlight, to, icon }: KpiCardProps) {
  const className = `relative block overflow-hidden rounded-xl border border-border-base/30 p-5 shadow-sm bg-bg-surface transition-all duration-300 ${
    to ? "group hover:border-primary/50 hover:bg-white hover:shadow-md" : ""
  }`;

  const iconBadge = (
    <>
      {highlight && (
        <span
          className="absolute -top-0.5 -right-0.5 z-10 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-bg-surface transition-opacity duration-300 group-hover:opacity-0"
          aria-hidden
        />
      )}
      <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-primary/10 text-primary transition-all duration-300 group-hover:opacity-0 group-hover:-translate-x-1">
        {icon}
      </span>
      <span className="absolute inset-0 flex items-center justify-center text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-lg font-bold">
        →
      </span>
    </>
  );

  const staticIcon = (
    <>
      {highlight && (
        <span
          className="absolute -top-0.5 -right-0.5 z-10 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-bg-surface"
          aria-hidden
        />
      )}
      <span className="flex h-full w-full items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </span>
    </>
  );

  const content = (
    <>
      {to && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top" />
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`text-xs font-semibold uppercase tracking-wider text-text-muted ${
              to
                ? "group-hover:text-primary transition-colors duration-300"
                : ""
            }`}
          >
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold text-text-main tracking-tight">
            {value}
          </p>
          {hint && (
            <p
              className={`mt-1 text-xs text-text-muted ${to ? "group-hover:text-text-main transition-colors duration-300" : ""}`}
            >
              {hint}
            </p>
          )}
        </div>
        <span className="relative shrink-0 h-9 w-9">
          {to ? iconBadge : staticIcon}
        </span>
      </div>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}

export default function CompanyOverviewTab() {
  const { data: settings, isLoading: loadingSettings } = useCompanySettings();
  const { data: members = [], isLoading: loadingMembers } = useCompanyMembers();
  const { data: pendingRequests = [], isLoading: loadingRequests } =
    usePendingCompanyRequests();
  const { data: orders = [], isLoading: loadingOrders } = useCompanyOrders();

  const isLoading =
    loadingSettings || loadingMembers || loadingRequests || loadingOrders;

  const stats = useMemo(() => {
    const openOrders = orders.filter((o) => OPEN_STATUSES.includes(o.status));
    const awaitingPayment = orders.filter(
      (o) => o.status === "PENDING_PAYMENT",
    ).length;
    const adminCount = members.filter(
      (m) => m.role === "COMPANY_ADMIN" || m.role === "ADMIN",
    ).length;
    const memberCount = members.length - adminCount;

    const countByStatus = (status: OrderStatus) =>
      orders.filter((o) => o.status === status).length;

    const statusCounts = PIPELINE_TILE_STATUSES.reduce(
      (acc, status) => {
        acc[status] = countByStatus(status);
        return acc;
      },
      {} as Record<OrderStatus, number>,
    );

    const billableOrders = orders.filter(
      (o) => o.status !== "CANCELLED" && o.status !== "RETURNED",
    );

    const openOrdersSorted = [...openOrders].sort((a, b) => {
      const pa = OPEN_STATUS_PRIORITY[a.status] ?? 99;
      const pb = OPEN_STATUS_PRIORITY[b.status] ?? 99;
      if (pa !== pb) return pa - pb;
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

    return {
      openOrders,
      openOrdersPreview: openOrdersSorted.slice(0, 5),
      awaitingPayment,
      adminCount,
      memberCount,
      statusCounts,
      totalValue: sumAmounts(billableOrders),
    };
  }, [orders, members]);

  if (isLoading) {
    return <p className="text-sm text-text-muted">Loading overview…</p>;
  }

  const discount = settings ? parseFloat(settings.discount_percentage) : 0;

  return (
    <div className="space-y-6 w-full">
      <div>
        <h2 className="text-3xl font-bold text-text-main mb-2 tracking-tight">
          Overview
        </h2>
        <p className="text-text-muted">
          Company activity and account health at a glance.
        </p>
        {settings && (
          <p className="mt-2 text-sm text-text-main font-medium">
            {settings.name}
            <span className="mx-2 text-text-muted">·</span>
            <span className="font-mono text-text-muted">
              {formatNip(settings.nip)}
            </span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Open orders"
          value={String(stats.openOrders.length)}
          hint={
            stats.awaitingPayment > 0
              ? `${stats.awaitingPayment} awaiting payment`
              : "All caught up"
          }
          highlight={stats.awaitingPayment > 0}
          to="/company/orders"
          icon={<Package size={20} />}
        />
        <KpiCard
          label="Members"
          value={String(members.length)}
          hint={`${stats.adminCount} admin · ${stats.memberCount} member${stats.memberCount === 1 ? "" : "s"}`}
          to="/company/members"
          icon={<Users size={20} />}
        />
        <KpiCard
          label="Pending join requests"
          value={String(pendingRequests.length)}
          hint={
            pendingRequests.length > 0
              ? "Needs review"
              : "No pending join requests"
          }
          highlight={pendingRequests.length > 0}
          to="/company/requests"
          icon={<UserPlus size={20} />}
        />
        <KpiCard
          label="Company discount"
          value={discount > 0 ? `${discount}%` : "—"}
          hint="Applied to B2B orders"
          icon={<Percent size={20} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:items-stretch">
        <Panel
          className="lg:col-span-2 h-full flex flex-col"
          title="Orders by status"
        >
          {orders.length === 0 ? (
            <p className="text-sm text-text-muted">No company orders yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 sm:grid-rows-2 gap-3 flex-1 min-h-0">
              {PIPELINE_TILE_STATUSES.map((status) => (
                <Link
                  key={status}
                  to={`/company/orders?status=${status}`}
                  className={`h-full flex flex-col justify-center rounded-lg px-3 py-2.5 transition-shadow duration-200 hover:shadow-sm ${ORDER_STATUS_STYLES[status]}`}
                >
                  <p className="text-sm font-semibold uppercase tracking-wider truncate">
                    {ORDER_STATUS_LABELS[status]}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-right">
                    {stats.statusCounts[status]}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          className="lg:col-span-1 h-full flex flex-col"
          title="Orders summary"
        >
          {orders.length === 0 ? (
            <p className="text-sm text-text-muted">No orders to summarize.</p>
          ) : (
            <div className="grid grid-rows-2 gap-3 flex-1 min-h-0">
              <Link
                to="/company/orders"
                className="h-full flex flex-col justify-center rounded-lg border border-border-base/30 bg-bg-base px-3 py-2.5 text-text-main transition-opacity hover:opacity-90"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  Total
                </p>
                <p className="mt-1 text-xl font-bold">{orders.length}</p>
              </Link>
              <div className="h-full flex flex-col justify-center rounded-lg border border-border-base/30 bg-bg-base px-3 py-2.5 text-text-main">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  Total order value
                </p>
                <p className="mt-1 text-xl font-bold font-mono">
                  ${stats.totalValue.toFixed(2)}
                </p>
              </div>
            </div>
          )}
        </Panel>
      </div>

      <Panel
        title="Open orders"
        description="Orders currently in progress."
        headerAside={
          <Link
            to="/company/orders"
            className="text-sm text-primary hover:underline shrink-0"
          >
            View all orders
          </Link>
        }
      >
        {stats.openOrders.length === 0 ? (
          <p className="text-sm text-text-muted">
            No open orders — all caught up.
          </p>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <table className={`${dataTableClass} min-w-[720px]`}>
              <thead>
                <tr className={dataTableHeadRowClass}>
                  <th className={`${dataTableThClass} !py-2 text-left`}>
                    Order #
                  </th>
                  <th className={`${dataTableThClass} !py-2 text-center`}>
                    Date
                  </th>
                  <th className={`${dataTableThClass} !py-2 text-left`}>
                    Ordered by
                  </th>
                  <th className={`${dataTableThClass} !py-2 text-center`}>
                    Amount
                  </th>
                  <th className={`${dataTableThClass} !py-2 text-center`}>
                    Status
                  </th>
                  <th className={`${dataTableThClass} !py-2 text-right w-[8%]`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.openOrdersPreview.map((order) => (
                  <tr key={order.id} className={dataTableRowClass}>
                    <td className={`${dataTableTdClass} !py-2 text-left`}>
                      <Link
                        to={`/company/orders/${order.id}`}
                        className="text-sm font-semibold font-mono text-text-main hover:text-primary"
                      >
                        #{order.id.slice(0, 8).toUpperCase()}
                      </Link>
                    </td>
                    <td
                      className={`${dataTableTdClass} !py-2 text-sm text-text-muted whitespace-nowrap text-center`}
                    >
                      {formatOrderDate(order.created_at)}
                    </td>
                    <td
                      className={`${dataTableTdClass} !py-2 text-sm text-text-main truncate max-w-[180px]`}
                    >
                      {placerName(order)}
                    </td>
                    <td
                      className={`${dataTableTdClass} !py-2 text-sm font-mono font-semibold text-text-main text-center whitespace-nowrap`}
                    >
                      ${Number(order.total_amount).toFixed(2)}
                    </td>
                    <td className={`${dataTableTdClass} !py-2 text-center`}>
                      <span
                        className={`inline-block text-[11px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-md ${
                          ORDER_STATUS_STYLES[order.status]
                        }`}
                      >
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td className={`${dataTableTdClass} !py-2 text-right`}>
                      <Link
                        to={`/company/orders/${order.id}`}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-md text-text-muted hover:text-primary hover:bg-primary/5 transition-colors"
                        aria-label={`View order ${order.id.slice(0, 8)}`}
                        title="View order"
                      >
                        <Eye size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
