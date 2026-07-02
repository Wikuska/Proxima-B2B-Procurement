import type { ProductSnapshot } from "../api/cart";
import type { PurchaseMode } from "../store/purchaseModeStore";

export type UnavailableReason =
  | "B2B_RESTRICTED"
  | "INSUFFICIENT_STOCK"
  | "INACTIVE";

export interface CartEligibility {
  available: boolean;
  reason?: UnavailableReason;
}

export function cartEligibility(
  product: ProductSnapshot,
  companyId: string | null | undefined,
  quantity: number,
  mode: PurchaseMode = "COMPANY",
): CartEligibility {
  if (!product.is_active) {
    return { available: false, reason: "INACTIVE" };
  }
  // B2B products require an active company affiliation AND company purchase mode.
  const canBuyB2B = !!companyId && mode === "COMPANY";
  if (product.is_b2b_only && !canBuyB2B) {
    return { available: false, reason: "B2B_RESTRICTED" };
  }
  if (quantity > product.stock_quantity) {
    return { available: false, reason: "INSUFFICIENT_STOCK" };
  }
  return { available: true };
}

export const UNAVAILABLE_REASON_LABEL: Record<UnavailableReason, string> = {
  INACTIVE: "Product unavailable",
  B2B_RESTRICTED: "Available to company accounts only",
  INSUFFICIENT_STOCK: "Not enough stock",
};
