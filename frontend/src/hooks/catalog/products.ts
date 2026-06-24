import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  fetchProducts,
  type FetchProductsPayload,
  fetchProductBySlug,
} from "../../api/catalog";

export const useProducts = (payload: FetchProductsPayload) => {
  return useQuery({
    queryKey: [
      "products",
      payload.category_slug || "all",
      payload.page,
      payload.size,
    ],
    queryFn: () => fetchProducts(payload),
    placeholderData: keepPreviousData,
  });
};

export const useProduct = (slug: string) => {
  return useQuery({
    queryKey: ["product", slug],

    queryFn: () => fetchProductBySlug(slug),

    enabled: !!slug,
  });
};
