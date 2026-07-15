import apiFetch from "./client";

export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface ProductListOut {
  id: string;
  name: string;
  slug: string;
  sku: string;
  base_price: number;
  stock_quantity: number;
  main_image_url: string | null;
  is_b2b_only: boolean;
  company_discount_percentage: string | null;
  company_unit_price: string | null;
}

export interface PaginatedProductListOut {
  items: ProductListOut[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface ProductVolumeDiscountOut {
  min_quantity: number;
  discount_percentage: string;
}

export interface ProductDetailsOut extends ProductListOut {
  description: string | null;
  is_active: boolean;
  volume_discounts: ProductVolumeDiscountOut[];
}

export type CatalogSort = "relevance" | "name_asc" | "price_asc" | "price_desc";

export interface FetchProductsPayload {
  category_slug?: string;
  search_query?: string;
  sort_by?: CatalogSort;
  page: number;
  size: number;
  signal?: AbortSignal;
}

export const fetchCategories = () => {
  return apiFetch<CategoryResponse[]>("/catalog/categories", {
    method: "GET",
  });
};

export const fetchProducts = ({
  category_slug,
  search_query,
  sort_by,
  page,
  size,
  signal,
}: FetchProductsPayload) => {
  const sortQuery = sort_by ? `&sort_by=${encodeURIComponent(sort_by)}` : "";

  if (category_slug) {
    return apiFetch<PaginatedProductListOut>(
      `/catalog/categories/${category_slug}/products?page=${page}&size=${size}${sortQuery}`,
      {
        method: "GET",
        signal,
      },
    );
  }
  let url = `/catalog/products?page=${page}&size=${size}${sortQuery}`;

  if (search_query) {
    url += `&search_query=${encodeURIComponent(search_query)}`;
  }

  return apiFetch<PaginatedProductListOut>(url, { method: "GET", signal });
};

export const fetchProductBySlug = (slug: string) => {
  return apiFetch<ProductDetailsOut>(`/catalog/products/${slug}`, {
    method: "GET",
  });
};

export const fetchRelatedProducts = (slug: string, limit = 8) => {
  return apiFetch<ProductListOut[]>(
    `/catalog/products/${slug}/related?limit=${limit}`,
    { method: "GET" },
  );
};
