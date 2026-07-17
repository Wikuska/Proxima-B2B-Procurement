import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { quoteCart, type QuoteItem } from "../../api/pricing";
import { usePurchaseMode } from "../../store/purchaseModeStore";
import type { PurchaseMode } from "../../store/purchaseModeStore";
import { useAuth } from "../user/useAuth";

export function useCartQuote(
  items: QuoteItem[],
  modeOverride?: PurchaseMode,
) {
  const storeMode = usePurchaseMode();
  const mode = modeOverride ?? storeMode;
  const { user } = useAuth();

  return useQuery({
    queryKey: ["cart-quote", items, mode, user?.company_id ?? null],
    queryFn: () => quoteCart(items, mode),
    enabled: items.length > 0,
    placeholderData: keepPreviousData,
  });
}
