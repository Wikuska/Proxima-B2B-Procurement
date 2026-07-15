import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  fetchProducts,
  type FetchProductsPayload,
  fetchProductBySlug,
  fetchRelatedProducts,
} from "../../api/catalog";

export const useProducts = (payload: FetchProductsPayload) => {
  return useQuery({
    queryKey: [
      "products",
      payload.category_slug || "all",
      payload.search_query || "",
      payload.sort_by || "",
      payload.page,
      payload.size,
    ],
    queryFn: ({ signal }) => fetchProducts({ ...payload, signal }),
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

export const useRelatedProducts = (slug: string) => {
  return useQuery({
    queryKey: ["products", "related", slug],
    queryFn: () => fetchRelatedProducts(slug),
    enabled: !!slug,
  });
};
