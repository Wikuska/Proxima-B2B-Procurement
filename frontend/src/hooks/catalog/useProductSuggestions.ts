import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "../../api/catalog";

export function useProductSuggestions(debouncedQ: string) {
  return useQuery({
    queryKey: ["products", "suggest", debouncedQ],
    queryFn: ({ signal }) =>
      fetchProducts({
        search_query: debouncedQ,
        page: 1,
        size: 8,
        sort_by: "relevance",
        signal,
      }),
    enabled: debouncedQ.length >= 2,
    staleTime: 30_000,
  });
}
