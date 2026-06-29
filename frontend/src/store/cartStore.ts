import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { useAuthStore } from "./authStore";

export interface CartStoreItem {
  product_id: string;
  quantity: number;
  selected: boolean;
}

interface CartState {
  items: CartStoreItem[];
  addItem: (product_id: string, quantity: number) => void;
  setQuantity: (product_id: string, quantity: number) => void;
  removeItem: (product_id: string) => void;
  toggleSelected: (product_id: string) => void;
  clear: () => void;
  replaceItems: (serverItems: CartStoreItem[]) => void;
  getQuantity: (product_id: string) => number;
}

export const useCartStore = create<CartState>()(
  devtools(
    persist(
      (set, get) => ({
        items: [],

        addItem: (product_id, quantity) =>
          set((state) => {
            const existing = state.items.find((i) => i.product_id === product_id);
            if (existing) {
              return {
                items: state.items.map((i) =>
                  i.product_id === product_id
                    ? { ...i, quantity: i.quantity + quantity }
                    : i,
                ),
              };
            }
            return {
              items: [...state.items, { product_id, quantity, selected: true }],
            };
          }),

        setQuantity: (product_id, quantity) =>
          set((state) => ({
            items: state.items.map((i) =>
              i.product_id === product_id ? { ...i, quantity } : i,
            ),
          })),

        removeItem: (product_id) =>
          set((state) => ({
            items: state.items.filter((i) => i.product_id !== product_id),
          })),

        toggleSelected: (product_id) =>
          set((state) => ({
            items: state.items.map((i) =>
              i.product_id === product_id ? { ...i, selected: !i.selected } : i,
            ),
          })),

        clear: () => set({ items: [] }),

        replaceItems: (serverItems) => set({ items: serverItems }),

        getQuantity: (product_id) =>
          get().items.find((i) => i.product_id === product_id)?.quantity ?? 0,
      }),
      {
        name: "shopping-cart",
        partialize: (state) =>
          useAuthStore.getState().token
            ? { items: [] }
            : { items: state.items },
      },
    ),
  ),
);
