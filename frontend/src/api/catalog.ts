import apiFetch from "./client";

export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

interface ProductListOut {
  id: string;
  name: string;
  slug: string;
  sku: string;
  base_price: number;
  stock_quantity: number;
  main_image_url: string | null;
  is_b2b_only: boolean;
}

export interface PaginatedProductListOut {
  items: ProductListOut[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface FetchProductsPayload {
  category_slug?: string;
  search_query?: string;
  page: number;
  size: number;
}

export const fetchCategories = () => {
  return apiFetch<CategoryResponse[]>("/catalog/categories", {
    method: "GET",
  });
};

export const fetchProducts = ({
  category_slug,
  search_query,
  page,
  size,
}: FetchProductsPayload) => {
  if (category_slug) {
    return apiFetch<PaginatedProductListOut>(
      `/catalog/categories/${category_slug}/products?page=${page}&size=${size}`,
      {
        method: "GET",
      },
    );
  }
  let url = `/catalog/products?page=${page}&size=${size}`;

  if (search_query) {
    url += `&search_query=${encodeURIComponent(search_query)}`;
  }

  return apiFetch<PaginatedProductListOut>(url, { method: "GET" });
};
