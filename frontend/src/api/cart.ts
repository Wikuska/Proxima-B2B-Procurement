import apiFetch, { API_URL } from "./client";

export interface ProductSnapshot {
  id: string;
  name: string;
  slug: string;
  sku: string;
  base_price: string;
  stock_quantity: number;
  main_image_url: string | null;
  is_b2b_only: boolean;
  is_active: boolean;
}

export interface CartItemOut {
  product: ProductSnapshot;
  quantity: number;
}

export interface CartItemIn {
  product_id: string;
  quantity: number;
}

export interface CartMergeItem {
  product_id: string;
  quantity: number;
}

export const getCart = (): Promise<CartItemOut[]> =>
  apiFetch<CartItemOut[]>("/cart");

export const addCartItem = (payload: CartItemIn): Promise<CartItemOut[]> =>
  apiFetch<CartItemOut[]>("/cart/items", { method: "POST", body: payload });

export const setCartItemQuantity = (
  product_id: string,
  quantity: number,
): Promise<CartItemOut[]> =>
  apiFetch<CartItemOut[]>(`/cart/items/${product_id}`, {
    method: "PATCH",
    body: { quantity },
  });

export const removeCartItem = (product_id: string): Promise<{ message: string }> =>
  apiFetch<{ message: string }>(`/cart/items/${product_id}`, { method: "DELETE" });

export const mergeCart = (items: CartMergeItem[]): Promise<CartItemOut[]> =>
  apiFetch<CartItemOut[]>("/cart/merge", { method: "POST", body: items });

export const clearCart = (): Promise<{ message: string }> =>
  apiFetch<{ message: string }>("/cart", { method: "DELETE" });

export const getProductsByIds = async (
  ids: string[],
): Promise<ProductSnapshot[]> => {
  if (ids.length === 0) return [];
  const res = await fetch(
    `${API_URL}/catalog/products/batch?ids=${ids.join(",")}`,
  );
  if (!res.ok) return [];
  return res.json();
};
