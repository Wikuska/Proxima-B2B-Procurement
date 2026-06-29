import type { ProductSnapshot } from "../api/cart";

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
): CartEligibility {
  if (!product.is_active) {
    return { available: false, reason: "INACTIVE" };
  }
  if (product.is_b2b_only && !companyId) {
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
