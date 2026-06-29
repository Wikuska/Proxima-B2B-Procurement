import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  addCartItem,
  removeCartItem,
  setCartItemQuantity,
} from "../../api/cart";
import type { CartStoreItem } from "../../store/cartStore";
import { useCartStore } from "../../store/cartStore";
import { useAuth } from "../user/useAuth";

export function useCartActions() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const store = useCartStore();
  const [pendingProductIds, setPendingProductIds] = useState<Set<string>>(
    new Set(),
  );

  function markPending(id: string) {
    setPendingProductIds((prev) => new Set(prev).add(id));
  }
  function clearPending(id: string) {
    setPendingProductIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function serverCartToStoreItems(serverCart: { product: { id: string }; quantity: number }[]): CartStoreItem[] {
    return serverCart.map((item) => ({
      product_id: item.product.id,
      quantity: item.quantity,
      selected: store.items.find((s) => s.product_id === item.product.id)?.selected ?? true,
    }));
  }

  async function add(product_id: string, quantity: number) {
    if (isAuthenticated) {
      markPending(product_id);
      try {
        const cart = await addCartItem({ product_id, quantity });
        store.replaceItems(serverCartToStoreItems(cart));
        queryClient.setQueryData(["cart"], cart);
        toast.success("Added to cart");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to add item";
        toast.error(message);
      } finally {
        clearPending(product_id);
      }
    } else {
      store.addItem(product_id, quantity);
      toast.success("Added to cart");
    }
  }

  async function setQty(product_id: string, quantity: number) {
    if (isAuthenticated) {
      markPending(product_id);
      const previous = store.items.find((i) => i.product_id === product_id);
      store.setQuantity(product_id, quantity);
      try {
        const cart = await setCartItemQuantity(product_id, quantity);
        store.replaceItems(serverCartToStoreItems(cart));
        queryClient.setQueryData(["cart"], cart);
      } catch (err: unknown) {
        if (previous) store.setQuantity(product_id, previous.quantity);
        const message = err instanceof Error ? err.message : "Failed to update quantity";
        toast.error(message);
      } finally {
        clearPending(product_id);
      }
    } else {
      store.setQuantity(product_id, quantity);
    }
  }

  async function remove(product_id: string) {
    if (isAuthenticated) {
      markPending(product_id);
      try {
        await removeCartItem(product_id);
        const updated = store.items.filter((i) => i.product_id !== product_id);
        store.replaceItems(updated);
        queryClient.setQueryData(
          ["cart"],
          (prev: { product: { id: string }; quantity: number }[] | undefined) =>
            prev?.filter((i) => i.product.id !== product_id) ?? [],
        );
        toast.success("Item removed");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to remove item";
        toast.error(message);
      } finally {
        clearPending(product_id);
      }
    } else {
      store.removeItem(product_id);
    }
  }

  function toggleSelect(product_id: string) {
    store.toggleSelected(product_id);
  }

  return { add, setQty, remove, toggleSelect, pendingProductIds };
}
