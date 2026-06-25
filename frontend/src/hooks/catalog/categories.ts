import { useQuery } from "@tanstack/react-query";
import { fetchCategories } from "../../api/catalog";
import { type CategoryResponse } from "../../api/catalog";

export function useCategories() {
  return useQuery<CategoryResponse[]>({
    queryKey: ["categories"],
    queryFn: fetchCategories,

    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 30,
  });
}
