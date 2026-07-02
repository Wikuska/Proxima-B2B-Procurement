import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

// Deliberate third Zustand store — purchase mode is a UI preference that must
// survive page refreshes and drives price display across the whole app (catalog,
// product page, cart). It is only meaningful for users with a company_id;
// the backend ignores the mode when no company exists. Using TanStack Query
// alone cannot provide this because mode is not server state — it is a local
// preference that changes how server data is interpreted.
// See also: cartStore.ts for the analogous cart exception.

export type PurchaseMode = "COMPANY" | "PRIVATE";

interface PurchaseModeState {
  mode: PurchaseMode;
  setMode: (mode: PurchaseMode) => void;
}

export const usePurchaseModeStore = create<PurchaseModeState>()(
  devtools(
    persist(
      (set) => ({
        mode: "COMPANY",
        setMode: (mode) => set({ mode }),
      }),
      { name: "purchase-mode" },
    ),
  ),
);

export function usePurchaseMode() {
  return usePurchaseModeStore((state) => state.mode);
}
