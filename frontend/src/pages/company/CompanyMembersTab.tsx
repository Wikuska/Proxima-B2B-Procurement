import { useMemo, useState } from "react";
import { Eye, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
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
  useCompanyMembers,
  useRemoveCompanyMember,
} from "../../hooks/company/requests";
import { useAuth } from "../../hooks/user/useAuth";
import { avatarTone } from "../../utils/avatarTone";
import { getInitials } from "../../utils/getInitials";

function roleLabel(role: string): string {
  if (role === "COMPANY_ADMIN" || role === "ADMIN") return "Admin";
  return "Member";
}

export default function CompanyMembersTab() {
  const { user: currentUser } = useAuth();
  const { data: members, isLoading, isError } = useCompanyMembers();
  const { mutate: remove, isPending } = useRemoveCompanyMember();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const handleRemove = (userId: string, name: string) => {
    if (!window.confirm(`Remove ${name} from the company?`)) return;

    remove(userId, {
      onSuccess: () => {
        toast.success(`${name} removed from the company.`);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to remove member.");
      },
    });
  };

  const allRows = members ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allRows;
    return allRows.filter((member) => {
      const fullName = `${member.first_name} ${member.last_name}`
        .trim()
        .toLowerCase();
      return (
        fullName.includes(q) ||
        member.first_name.toLowerCase().includes(q) ||
        member.last_name.toLowerCase().includes(q) ||
        member.email.toLowerCase().includes(q)
      );
    });
  }, [allRows, search]);

  const { pageItems, pageCount, safePage, from, to } = paginateRows(
    filtered,
    page,
  );

  if (isLoading)
    return <p className="text-sm text-text-muted">Loading members…</p>;
  if (isError)
    return <p className="text-sm text-red-500">Failed to load members.</p>;

  const isEmpty = filtered.length === 0;

  return (
    <div className="space-y-4 w-full">
      <div>
        <h2 className="text-3xl font-bold text-text-main mb-2 tracking-tight">
          Members
        </h2>
        <p className="text-text-muted mb-5">
          People affiliated with your company account.
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
            placeholder="Search by name or email…"
          />
        }
        isEmpty={isEmpty}
        emptyContent={
          <p className="text-sm">
            {allRows.length === 0
              ? "No members found."
              : "No members match your search."}
          </p>
        }
        footer={
          !isEmpty ? (
            <TablePagination
              from={from}
              to={to}
              total={filtered.length}
              noun="members"
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
              <th className={`${dataTableThClass} text-left`}>Work email</th>
              <th className={`${dataTableThClass} text-center`}>Joined</th>
              <th className={`${dataTableThClass} text-center`}>Role</th>
              <th className={`${dataTableThClass} text-right w-[12%]`}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((member) => {
              const fullName =
                `${member.first_name} ${member.last_name}`.trim();
              const isSelf = member.id === currentUser?.id;
              const isAdmin =
                member.role === "COMPANY_ADMIN" || member.role === "ADMIN";
              const canRemove = !isSelf && !isAdmin;

              return (
                <tr key={member.id} className={dataTableRowClass}>
                  <td className={`${dataTableTdClass} text-left`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold ${avatarTone(member.id)}`}
                        aria-hidden
                      >
                        {getInitials(fullName || "?")}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-main truncate">
                          {fullName || "—"}
                          {isSelf && (
                            <span className="ml-1.5 text-xs font-normal text-text-muted">
                              (you)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td
                    className={`${dataTableTdClass} text-sm text-text-muted truncate`}
                  >
                    {member.email}
                  </td>
                  <td
                    className={`${dataTableTdClass} text-sm text-text-muted whitespace-nowrap text-center`}
                  >
                    {member.company_joined_at
                      ? formatOrderDate(member.company_joined_at)
                      : "—"}
                  </td>
                  <td className={`${dataTableTdClass} text-center`}>
                    <span
                      className={`inline-block text-[11px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-md ${
                        isAdmin
                          ? "bg-amber-500/15 text-amber-700 border border-amber-500/30"
                          : "bg-border-base/15 text-text-main border border-border-base/25"
                      }`}
                    >
                      {roleLabel(member.role)}
                    </span>
                  </td>
                  <td className={`${dataTableTdClass} text-right`}>
                    <div className="inline-flex items-center justify-end gap-0.5">
                      <Link
                        to={`/company/orders?member=${member.id}`}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-md text-text-muted hover:text-primary hover:bg-primary/5 transition-colors"
                        aria-label={`View orders for ${fullName || member.email}`}
                        title="View order history"
                      >
                        <Eye size={16} />
                      </Link>
                      {canRemove && (
                        <button
                          type="button"
                          onClick={() =>
                            handleRemove(member.id, fullName || member.email)
                          }
                          disabled={isPending}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-md text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                          aria-label={`Remove ${fullName || member.email}`}
                          title="Remove member"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
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
