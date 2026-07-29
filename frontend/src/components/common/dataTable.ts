export const DATA_TABLE_PAGE_SIZE = 9;

export const dataTableClass =
  "w-full table-fixed border-collapse min-w-[720px]";

export const dataTableHeadRowClass =
  "bg-bg-base text-[11px] uppercase tracking-wider text-text-muted";

export const dataTableThClass = "px-4 py-3 font-semibold";

export const dataTableRowClass =
  "border-t border-border-base/15 hover:bg-bg-base/80 transition-colors";

export const dataTableTdClass = "px-4 py-3.5";

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
