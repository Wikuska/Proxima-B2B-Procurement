import { useQuery } from "@tanstack/react-query";
import { getProductPricing } from "../../api/pricing";
import { usePurchaseMode } from "../../store/purchaseModeStore";
import { useAuth } from "../user/useAuth";

export function useProductPricing(slug: string) {
  const mode = usePurchaseMode();
  const { user } = useAuth();

  return useQuery({
    queryKey: ["product-pricing", slug, mode, user?.company_id ?? null],
    queryFn: () => getProductPricing(slug, mode),
    enabled: !!slug,
  });
}
