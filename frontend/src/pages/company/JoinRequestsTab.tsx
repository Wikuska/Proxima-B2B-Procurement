import { useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import DataTableShell, {
  DataTableSearch,
  TablePagination,
  dataTableClass,
  dataTableHeadRowClass,
  dataTableRowClass,
  dataTableTdClass,
  dataTableThClass,
  paginateRows,
} from "../../components/common/DataTableShell";
import { formatOrderDate } from "../../components/orders/types";
import {
  usePendingCompanyRequests,
  useReviewCompanyRequest,
} from "../../hooks/company/requests";
import { avatarTone } from "../../utils/avatarTone";
import { getInitials } from "../../utils/getInitials";

const formatNip = (nip: string) => {
  const cleaned = nip.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 8)}-${cleaned.slice(8, 10)}`;
  }
  return nip;
};

export default function JoinRequestsTab() {
  const { data: requests, isLoading, isError } = usePendingCompanyRequests();
  const { mutate: review, isPending } = useReviewCompanyRequest();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const handleReview = (id: string, approve: boolean) => {
    review(
      { id, approve },
      {
        onSuccess: () => {
          toast.success(approve ? "Request approved." : "Request rejected.");
        },
        onError: (error) => {
          toast.error(error.message || "Action failed.");
        },
      },
    );
  };

  const allRows = requests ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allRows;
    return allRows.filter((req) => {
      const fullName =
        `${req.user.first_name} ${req.user.last_name}`.trim().toLowerCase();
      return (
        fullName.includes(q) ||
        req.user.first_name.toLowerCase().includes(q) ||
        req.user.last_name.toLowerCase().includes(q) ||
        req.user.email.toLowerCase().includes(q) ||
        req.requested_nip.includes(q) ||
        formatNip(req.requested_nip).toLowerCase().includes(q)
      );
    });
  }, [allRows, search]);

  const { pageItems, pageCount, safePage, from, to } = paginateRows(
    filtered,
    page,
  );

  if (isLoading)
    return <p className="text-sm text-text-muted">Loading requests…</p>;
  if (isError)
    return <p className="text-sm text-red-500">Failed to load requests.</p>;

  const isEmpty = filtered.length === 0;

  return (
    <div className="space-y-4 w-full">
      <div>
        <h2 className="text-3xl font-bold text-text-main mb-2 tracking-tight">
          Join requests
        </h2>
        <p className="text-text-muted mb-5">
          Pending affiliation requests for your company.
        </p>
      </div>

      <DataTableShell
        toolbar={
          <DataTableSearch
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(0);
            }}
            placeholder="Search by name, email, or NIP…"
          />
        }
        isEmpty={isEmpty}
        emptyContent={
          <p className="text-sm">
            {allRows.length === 0
              ? "No pending requests."
              : "No requests match your search."}
          </p>
        }
        footer={
          !isEmpty ? (
            <TablePagination
              from={from}
              to={to}
              total={filtered.length}
              noun="requests"
              page={safePage}
              pageCount={pageCount}
              onPageChange={setPage}
            />
          ) : undefined
        }
      >
        <table className={dataTableClass}>
          <thead>
            <tr className={dataTableHeadRowClass}>
              <th className={`${dataTableThClass} text-left w-[28%]`}>Name</th>
              <th className={`${dataTableThClass} text-left`}>Email</th>
              <th className={`${dataTableThClass} text-center`}>NIP</th>
              <th className={`${dataTableThClass} text-center`}>Requested</th>
              <th className={`${dataTableThClass} text-right w-[12%]`}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((req) => {
              const fullName =
                `${req.user.first_name} ${req.user.last_name}`.trim();

              return (
                <tr key={req.id} className={dataTableRowClass}>
                  <td className={`${dataTableTdClass} text-left`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold ${avatarTone(req.user.id)}`}
                        aria-hidden
                      >
                        {getInitials(fullName || "?")}
                      </span>
                      <p className="text-sm font-medium text-text-main truncate">
                        {fullName || "—"}
                      </p>
                    </div>
                  </td>
                  <td
                    className={`${dataTableTdClass} text-sm text-text-muted truncate`}
                  >
                    {req.user.email}
                  </td>
                  <td
                    className={`${dataTableTdClass} text-sm font-mono text-text-muted whitespace-nowrap text-center`}
                  >
                    {formatNip(req.requested_nip)}
                  </td>
                  <td
                    className={`${dataTableTdClass} text-sm text-text-muted whitespace-nowrap text-center`}
                  >
                    {formatOrderDate(req.created_at)}
                  </td>
                  <td className={`${dataTableTdClass} text-right`}>
                    <div className="inline-flex items-center justify-end gap-0.5">
                      <button
                        type="button"
                        onClick={() => handleReview(req.id, true)}
                        disabled={isPending}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-md text-text-muted hover:text-green-700 hover:bg-green-50 transition-colors disabled:opacity-50"
                        aria-label={`Approve ${fullName || req.user.email}`}
                        title="Approve"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReview(req.id, false)}
                        disabled={isPending}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-md text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                        aria-label={`Reject ${fullName || req.user.email}`}
                        title="Reject"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </DataTableShell>
    </div>
  );
}
