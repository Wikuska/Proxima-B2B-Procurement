import apiFetch from "./client";

export interface AdminProductCategory {
  id: string;
  name: string;
  slug: string;
}

export interface AdminVolumeDiscount {
  min_quantity: number;
  discount_percentage: string;
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
  volume_discounts: AdminVolumeDiscount[];
}

export interface AdminProductWriteIn {
  name: string;
  sku: string;
  category_id: string;
  description?: string | null;
  base_price: string;
  stock_quantity: number;
  main_image_url?: string | null;
  is_active: boolean;
  is_b2b_only: boolean;
  volume_discounts: AdminVolumeDiscount[];
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

export function createAdminProduct(data: AdminProductWriteIn) {
  return apiFetch<AdminProductDetailsOut>("/admin/products", {
    method: "POST",
    body: data,
  });
}

export function updateAdminProduct(productId: string, data: AdminProductWriteIn) {
  return apiFetch<AdminProductDetailsOut>(`/admin/products/${productId}`, {
    method: "PUT",
    body: data,
  });
}
