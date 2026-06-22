import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export const useUrlPagination = (
  totalPages: number,
  defaultSize: number = 24,
) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawPage = parseInt(searchParams.get("page") || "1", 10);
  const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

  useEffect(() => {
    if (isNaN(rawPage) || rawPage < 1) {
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

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      prev.set("page", newPage.toString());
      return prev;
    });
  };
  return { page, size: defaultSize, handlePageChange };
};
