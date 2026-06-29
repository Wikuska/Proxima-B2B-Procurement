import { useQuery } from "@tanstack/react-query";
import { getCart, getProductsByIds } from "../../api/cart";
import { useCartStore } from "../../store/cartStore";
import { cartEligibility, type UnavailableReason } from "../../utils/cartEligibility";
import { useAuth } from "../user/useAuth";

export interface CartLineItem {
  product_id: string;
  name: string;
  slug: string;
  sku: string;
  base_price: number;
  stock_quantity: number;
  main_image_url: string | null;
  is_b2b_only: boolean;
  is_active: boolean;
  quantity: number;
  selected: boolean;
  available: boolean;
  unavailableReason?: UnavailableReason;
}

export function useCartView() {
  const { isAuthenticated, user } = useAuth();
  const storeItems = useCartStore((s) => s.items);

  const authQuery = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
    enabled: isAuthenticated,
  });

  const guestIds = !isAuthenticated ? storeItems.map((i) => i.product_id) : [];
  const guestQuery = useQuery({
    queryKey: ["cart-guest", guestIds],
    queryFn: () => getProductsByIds(guestIds),
    enabled: !isAuthenticated && guestIds.length > 0,
  });

  const isLoading = isAuthenticated ? authQuery.isLoading : guestQuery.isLoading;
  const isError = isAuthenticated ? authQuery.isError : guestQuery.isError;

  let lines: CartLineItem[] = [];

  if (isAuthenticated && authQuery.data) {
    lines = authQuery.data.map((item): CartLineItem => {
      const storeItem = storeItems.find((s) => s.product_id === item.product.id);
      const { available, reason } = cartEligibility(item.product, user?.company_id, item.quantity);
      return {
        product_id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        sku: item.product.sku,
        base_price: Number(item.product.base_price),
        stock_quantity: item.product.stock_quantity,
        main_image_url: item.product.main_image_url,
        is_b2b_only: item.product.is_b2b_only,
        is_active: item.product.is_active,
        quantity: item.quantity,
        selected: storeItem?.selected ?? true,
        available,
        unavailableReason: reason,
      };
    });
  } else if (!isAuthenticated && guestQuery.data) {
    const productMap = new Map(guestQuery.data.map((p) => [p.id, p]));
    lines = storeItems
      .flatMap((storeItem): CartLineItem[] => {
        const product = productMap.get(storeItem.product_id);
        if (!product) return [];
        const { available, reason } = cartEligibility(product, user?.company_id, storeItem.quantity);
        return [{
          product_id: product.id,
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          base_price: Number(product.base_price),
          stock_quantity: product.stock_quantity,
          main_image_url: product.main_image_url,
          is_b2b_only: product.is_b2b_only,
          is_active: product.is_active,
          quantity: storeItem.quantity,
          selected: storeItem.selected,
          available,
          unavailableReason: reason,
        }];
      });
  }

  const availableSubtotal = lines
    .filter((l) => l.available)
    .reduce((sum, l) => sum + l.base_price * l.quantity, 0);

  const selectedSubtotal = lines
    .filter((l) => l.available && l.selected)
    .reduce((sum, l) => sum + l.base_price * l.quantity, 0);

  return { lines, availableSubtotal, selectedSubtotal, isLoading, isError };
}
