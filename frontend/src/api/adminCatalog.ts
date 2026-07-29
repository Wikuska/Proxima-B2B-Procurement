import apiFetch from "./client";

export interface AdminProductCategory {
  id: string;
  name: string;
  slug: string;
}

export interface AdminProductListOut {
  id: string;
  name: string;
  slug: string;
  sku: string;
  base_price: string;
  stock_quantity: number;
  is_active: boolean;
  is_b2b_only: boolean;
  category: AdminProductCategory;
}

export interface AdminProductDetailsOut extends AdminProductListOut {
  description: string | null;
  main_image_url: string | null;
}

export function fetchAdminProducts(signal?: AbortSignal) {
  return apiFetch<AdminProductListOut[]>("/admin/products", {
    method: "GET",
    signal,
  });
}

export function fetchAdminProduct(productId: string, signal?: AbortSignal) {
  return apiFetch<AdminProductDetailsOut>(`/admin/products/${productId}`, {
    method: "GET",
    signal,
  });
}
