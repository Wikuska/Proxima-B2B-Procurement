import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

export const DATA_TABLE_PAGE_SIZE = 10;

export const dataTableClass =
  "w-full table-fixed border-collapse min-w-[720px]";

export const dataTableHeadRowClass =
  "bg-bg-base text-[11px] uppercase tracking-wider text-text-muted";

export const dataTableThClass = "px-4 py-3 font-semibold";

export const dataTableRowClass =
  "border-t border-border-base/15 hover:bg-bg-base/80 transition-colors";

export const dataTableTdClass = "px-4 py-3.5";

interface DataTableShellProps {
  toolbar?: ReactNode;
  isEmpty: boolean;
  emptyContent: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Shared chrome for dashboard tables (card, toolbar, empty, footer). */
export default function DataTableShell({
  toolbar,
  isEmpty,
  emptyContent,
  footer,
  children,
  className = "",
}: DataTableShellProps) {
  return (
    <div
      className={`bg-bg-surface border border-border-base/30 rounded-xl overflow-hidden shadow-sm w-full ${className}`}
    >
      {toolbar && (
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center border-b border-border-base/20">
          {toolbar}
        </div>
      )}

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center p-12 text-text-muted">
          {emptyContent}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">{children}</div>
          {footer}
        </>
      )}
    </div>
  );
}

interface DataTableSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function DataTableSearch({
  value,
  onChange,
  placeholder = "Search…",
}: DataTableSearchProps) {
  return (
    <label className="relative flex-1 min-w-0">
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border-base/40 bg-bg-base text-text-main placeholder:text-text-muted focus:outline-none focus:border-border-focus"
      />
    </label>
  );
}

interface TablePaginationProps {
  from: number;
  to: number;
  total: number;
  noun: string;
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

export function TablePagination({
  from,
  to,
  total,
  noun,
  page,
  pageCount,
  onPageChange,
}: TablePaginationProps) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-border-base/20">
      <p className="text-xs text-text-muted">
        Showing {from}–{to} of {total} {noun}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 0}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-border-base/40 text-text-muted hover:bg-bg-base disabled:opacity-40 disabled:pointer-events-none"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          disabled={page >= pageCount - 1}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-border-base/40 text-text-muted hover:bg-bg-base disabled:opacity-40 disabled:pointer-events-none"
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

/** Slice helpers shared by client-side paginated tables. */
export function paginateRows<T>(
  rows: T[],
  page: number,
  pageSize = DATA_TABLE_PAGE_SIZE,
): {
  pageItems: T[];
  pageCount: number;
  safePage: number;
  from: number;
  to: number;
} {
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const pageItems = rows.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const from = rows.length === 0 ? 0 : safePage * pageSize + 1;
  const to = Math.min((safePage + 1) * pageSize, rows.length);
  return { pageItems, pageCount, safePage, from, to };
}
