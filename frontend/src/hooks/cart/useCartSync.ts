import { useEffect, useRef } from "react";
import { mergeCart } from "../../api/cart";
import type { CartStoreItem } from "../../store/cartStore";
import { useCartStore } from "../../store/cartStore";
import { useAuth } from "../user/useAuth";

export function useCartSync() {
  const { isAuthenticated } = useAuth();
  const previouslyAuthenticated = useRef(isAuthenticated);

  useEffect(() => {
    const wasAuthenticated = previouslyAuthenticated.current;
    previouslyAuthenticated.current = isAuthenticated;

    if (isAuthenticated && !wasAuthenticated) {
      const { items, replaceItems } = useCartStore.getState();
      const guestItems = items.filter((i) => i.quantity > 0);
      if (guestItems.length > 0) {
        mergeCart(
          guestItems.map((i) => ({
            product_id: i.product_id,
            quantity: i.quantity,
          })),
        ).then((serverCart) => {
          const merged: CartStoreItem[] = serverCart.map((item) => ({
            product_id: item.product.id,
            quantity: item.quantity,
            selected: true,
          }));
          replaceItems(merged);
        });
      }
      return;
    }

    if (!isAuthenticated && wasAuthenticated) {
      useCartStore.getState().clear();
    }
  }, [isAuthenticated]);
}
