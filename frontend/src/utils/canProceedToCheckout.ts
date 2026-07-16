import type { PurchaseMode } from "../store/purchaseModeStore";

export type CheckoutGateResult =
  | { ok: true }
  | { ok: false; reason: "NO_SELECTION" | "B2B_ONLY_IN_PRIVATE" };

export function canProceedToCheckout(
  selectedLines: Array<{ is_b2b_only: boolean }>,
  mode: PurchaseMode,
  companyId: string | null | undefined,
): CheckoutGateResult {
  if (selectedLines.length === 0) {
    return { ok: false, reason: "NO_SELECTION" };
  }

  const canBuyB2b = mode === "COMPANY" && !!companyId;
  if (selectedLines.some((l) => l.is_b2b_only) && !canBuyB2b) {
    return { ok: false, reason: "B2B_ONLY_IN_PRIVATE" };
  }

  return { ok: true };
}

export const CHECKOUT_GATE_MESSAGE: Record<
  Exclude<CheckoutGateResult, { ok: true }>["reason"],
  string
> = {
  NO_SELECTION: "Select at least one available item",
  B2B_ONLY_IN_PRIVATE:
    "Switch to Company mode to purchase company-only products",
};
