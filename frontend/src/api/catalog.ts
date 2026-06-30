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

export const fetchProductBySlug = (slug: string) => {
  return apiFetch<ProductDetailsOut>(`/catalog/products/${slug}`, {
    method: "GET",
  });
};
