import type { PurchaseType } from "../api/order";
import type { PurchaseMode } from "../store/purchaseModeStore";

export function derivePurchaseType(
  mode: PurchaseMode,
  companyId: string | null | undefined,
): PurchaseType {
  return mode === "COMPANY" && companyId ? "B2B" : "B2C";
}
