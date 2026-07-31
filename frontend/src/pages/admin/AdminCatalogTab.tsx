import { useMemo, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import DataTableShell, {
  DataTableSearch,
  TablePagination,
} from "../../components/common/DataTableShell";
import CustomSelect from "../../components/common/CustomSelect";
import DataTableSegmented from "../../components/common/DataTableSegmented";
import {
  dataTableClass,
  dataTableHeadRowClass,
  dataTableRowClass,
  dataTableTdClass,
  dataTableThClass,
  paginateRows,
} from "../../components/common/dataTable";
import { useAdminProducts } from "../../hooks/admin/useAdminCatalog";
import { fetchCategories } from "../../api/catalog";

type StatusFilter = "all" | "active" | "inactive";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const LOW_STOCK_THRESHOLD = 50;

export default function AdminCatalogTab() {
  const { data: products, isLoading, isError } = useAdminProducts();
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(0);

  const allRows = products ?? [];

  const categoryOptions = useMemo(
    () => [
      { value: "", label: "All categories" },
      ...categories.map((category) => ({
        value: category.id,
        label: category.name,
      })),
    ],
    [categories],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allRows.filter((product) => {
      if (categoryId && product.category.id !== categoryId) return false;
      if (statusFilter === "active" && !product.is_active) return false;
      if (statusFilter === "inactive" && product.is_active) return false;
      if (lowStockOnly && product.stock_quantity >= LOW_STOCK_THRESHOLD) {
        return false;
      }
      if (!q) return true;
      return (
        product.name.toLowerCase().includes(q) ||
        product.sku.toLowerCase().includes(q)
      );
    });
  }, [allRows, search, categoryId, statusFilter, lowStockOnly]);

  const { pageItems, pageCount, safePage, from, to } = paginateRows(
    filtered,
    page,
  );

  if (isLoading)
    return <p className="text-sm text-text-muted">Loading catalog…</p>;
  if (isError)
    return <p className="text-sm text-red-500">Failed to load catalog.</p>;

  const isEmpty = filtered.length === 0;

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-text-main mb-2 tracking-tight">
            Catalog
          </h2>
          <p className="text-text-muted">
            Manage products available in the store.
          </p>
        </div>
        <Link
          to="/admin/catalog/new"
          className="inline-flex items-center justify-center gap-2 shrink-0 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} strokeWidth={2.5} />
          Add product
        </Link>
      </div>

      <DataTableShell
        toolbar={
          <>
            <DataTableSearch
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(0);
              }}
              placeholder="Search by name or SKU…"
            />
            <CustomSelect
              value={categoryId}
              onChange={(value) => {
                setCategoryId(value);
                setPage(0);
              }}
              options={categoryOptions}
              aria-label="Filter by category"
              className="sm:w-52"
            />
            <DataTableSegmented
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
                setPage(0);
              }}
              options={STATUS_FILTERS}
              aria-label="Filter by status"
            />
            <label className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-border-base/30 bg-bg-base px-3 py-2 text-sm text-text-main select-none">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => {
                  setLowStockOnly(e.target.checked);
                  setPage(0);
                }}
                className="size-3.5 rounded border-border-base/50 text-primary accent-primary focus:ring-border-focus"
              />
              <span className="whitespace-nowrap">
                Stock under {LOW_STOCK_THRESHOLD}
              </span>
            </label>
          </>
        }
        isEmpty={isEmpty}
        emptyContent={
          <p className="text-sm">
            {allRows.length === 0
              ? "No products yet."
              : "No products match your filters."}
          </p>
        }
        footer={
          !isEmpty ? (
            <TablePagination
              from={from}
              to={to}
              total={filtered.length}
              noun="products"
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
              <th className={`${dataTableThClass} text-left w-[22%]`}>Name</th>
              <th className={`${dataTableThClass} text-center w-[14%]`}>SKU</th>
              <th className={`${dataTableThClass} text-center w-[18%]`}>
                Category
              </th>
              <th className={`${dataTableThClass} text-center w-[10%]`}>
                Price
              </th>
              <th className={`${dataTableThClass} text-center w-[8%]`}>Stock</th>
              <th className={`${dataTableThClass} text-center w-[10%]`}>
                Status
              </th>
              <th className={`${dataTableThClass} text-center w-[8%]`}>B2B</th>
              <th className={`${dataTableThClass} text-right w-[6%]`}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((product) => (
              <tr key={product.id} className={dataTableRowClass}>
                <td
                  className={`${dataTableTdClass} text-sm font-medium text-text-main truncate`}
                >
                  {product.name}
                </td>
                <td
                  className={`${dataTableTdClass} text-sm font-mono text-text-muted truncate text-center`}
                >
                  {product.sku}
                </td>
                <td
                  className={`${dataTableTdClass} text-sm text-text-muted truncate text-center`}
                >
                  {product.category.name}
                </td>
                <td
                  className={`${dataTableTdClass} text-sm font-mono font-semibold text-text-main text-center whitespace-nowrap`}
                >
                  ${Number(product.base_price).toFixed(2)}
                </td>
                <td
                  className={`${dataTableTdClass} text-sm text-center font-mono ${
                    product.stock_quantity <= 0
                      ? "text-amber-700 font-semibold"
                      : "text-text-main"
                  }`}
                >
                  {product.stock_quantity}
                </td>
                <td className={`${dataTableTdClass} text-center`}>
                  <span
                    className={`inline-block text-[11px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-md ${
                      product.is_active
                        ? "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30"
                        : "bg-border-base/15 text-text-muted border border-border-base/25"
                    }`}
                  >
                    {product.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className={`${dataTableTdClass} text-center`}>
                  {product.is_b2b_only ? (
                    <span className="inline-block text-[11px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-md bg-primary/10 text-primary border border-primary/25">
                      B2B
                    </span>
                  ) : (
                    <span className="text-sm text-text-muted">—</span>
                  )}
                </td>
                <td className={`${dataTableTdClass} text-right`}>
                  <Link
                    to={`/admin/catalog/${product.id}`}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-md text-text-muted hover:text-primary hover:bg-primary/5 transition-colors"
                    aria-label={`Edit ${product.name}`}
                    title="Edit product"
                  >
                    <Pencil size={16} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTableShell>
    </div>
  );
}
