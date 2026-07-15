import { useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export type CatalogSort = "relevance" | "name_asc" | "price_asc" | "price_desc";

const VALID_SORTS = new Set<CatalogSort>([
  "relevance",
  "name_asc",
  "price_asc",
  "price_desc",
]);

const DEFAULT_SIZE = 24;

export function useCatalogParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const q = searchParams.get("q")?.trim() || undefined;
  const rawSort = searchParams.get("sort");
  const sort =
    rawSort && VALID_SORTS.has(rawSort as CatalogSort)
      ? (rawSort as CatalogSort)
      : undefined;

  const rawPage = parseInt(searchParams.get("page") || "1", 10);
  const page = Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

  const updateParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        mutate(next);
        return next;
      });
    },
    [setSearchParams],
  );

  const setSearchTerm = useCallback(
    (term: string) => {
      const trimmed = term.trim();
      updateParams((params) => {
        if (trimmed) {
          params.set("q", trimmed);
        } else {
          params.delete("q");
        }
        params.delete("sort");
        params.set("page", "1");
      });
    },
    [updateParams],
  );

  const setSort = useCallback(
    (nextSort: CatalogSort) => {
      updateParams((params) => {
        const hasQuery = !!params.get("q")?.trim();
        if (!hasQuery && (nextSort === "relevance" || nextSort === "name_asc")) {
          params.delete("sort");
        } else {
          params.set("sort", nextSort);
        }
        params.set("page", "1");
      });
    },
    [updateParams],
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      updateParams((params) => {
        params.set("page", newPage.toString());
      });
    },
    [updateParams],
  );

  return {
    q,
    sort,
    page,
    size: DEFAULT_SIZE,
    setSearchTerm,
    setSort,
    handlePageChange,
  };
}

/** Clamps ?page= to a valid range once totalPages is known from the API. */
export function useClampCatalogPage(totalPages: number) {
  const [searchParams, setSearchParams] = useSearchParams();

  const rawPage = parseInt(searchParams.get("page") || "1", 10);
  const page = Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

  useEffect(() => {
    if (Number.isNaN(rawPage) || rawPage < 1) {
      setSearchParams(
        (prev) => {
          prev.set("page", "1");
          return prev;
        },
        { replace: true },
      );
      return;
    }

    if (totalPages > 0 && page > totalPages) {
      setSearchParams(
        (prev) => {
          prev.set("page", totalPages.toString());
          return prev;
        },
        { replace: true },
      );
    }
  }, [rawPage, page, totalPages, setSearchParams]);
}
