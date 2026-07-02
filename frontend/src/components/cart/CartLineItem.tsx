import { Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { UNAVAILABLE_REASON_LABEL } from "../../utils/cartEligibility";
import type { CartLineItem as CartLine } from "../../hooks/cart/useCartView";
import type { LinePricingOut } from "../../api/pricing";
import ProductImage from "../product/ProductImage";
import QuantityStepper from "../product/QuantityStepper";

interface CartLineItemProps {
  line: CartLine;
  pricingLine?: LinePricingOut | null;
  /** Compact mode for the cart dropdown: no discount labels, just ~~base~~ + final price. */
  compact?: boolean;
  showCheckbox?: boolean;
  onSetQty: (product_id: string, qty: number) => void;
  onRemove: (product_id: string) => void;
  onToggleSelect?: (product_id: string) => void;
  isPending: boolean;
}

export default function CartLineItem({
  line,
  pricingLine,
  compact = false,
  showCheckbox = false,
  onSetQty,
  onRemove,
  onToggleSelect,
  isPending,
}: CartLineItemProps) {
  const {
    product_id,
    name,
    slug,
    base_price,
    stock_quantity,
    main_image_url,
    quantity,
    selected,
    available,
    unavailableReason,
  } = line;

  const companyPct = pricingLine ? Number(pricingLine.company_pct) : 0;
  const volumePct = pricingLine ? Number(pricingLine.volume_pct) : 0;
  const priceAfterCompany = pricingLine
    ? Number(pricingLine.price_after_company)
    : base_price;
  const finalUnitPrice = pricingLine
    ? Number(pricingLine.final_unit_price)
    : base_price;
  const lineTotal = pricingLine
    ? Number(pricingLine.line_total)
    : base_price * quantity;
  const effectivePct = pricingLine ? Number(pricingLine.effective_pct) : 0;

  const hasDiscount = effectivePct > 0;
  const hasCompanyDiscount = companyPct > 0;
  const hasVolumeDiscount = volumePct > 0;

  return (
    <div
      className={`flex gap-4 py-4 transition-opacity ${!available ? "opacity-50" : ""} ${
        compact ? "items-start" : "items-center"
      }`}
    >
      {showCheckbox && (
        <div className={compact ? "pt-1" : ""}>
          <input
            type="checkbox"
            checked={selected && available}
            disabled={!available || isPending}
            onChange={() => onToggleSelect?.(product_id)}
            aria-label={`Select ${name}`}
            className="w-4 h-4 accent-primary cursor-pointer disabled:cursor-not-allowed"
          />
        </div>
      )}
      <ProductImage
        src={main_image_url}
        alt={name}
        compact={compact}
        className={`flex-shrink-0 ${compact ? "w-16" : "w-24"}`}
      />
      <div
        className={`flex flex-1 min-w-0 justify-between items-center ${
          compact ? "gap-2" : "gap-4"
        }`}
      >
        <div
          className={`flex flex-col flex-1 min-w-0 ${compact ? "pr-2" : "pr-6"}`}
        >
          <Link
            to={`/product/${slug}`}
            className={`font-medium text-text-main hover:text-accent truncate block transition-colors ${
              compact ? "text-sm" : "text-base"
            }`}
          >
            {name}
          </Link>

          {!available && unavailableReason && (
            <p className="text-xs text-red-500 mt-1 font-medium">
              {
                UNAVAILABLE_REASON_LABEL[
                  unavailableReason as keyof typeof UNAVAILABLE_REASON_LABEL
                ]
              }
            </p>
          )}
          {available &&
            (compact ? (
              <div className="flex items-baseline gap-2 mt-1">
                {hasDiscount ? (
                  <>
                    <span className="text-xs text-text-muted line-through font-mono">
                      ${base_price.toFixed(2)}/pc.
                    </span>
                    <span className="text-sm font-semibold text-text-main font-mono">
                      ${finalUnitPrice.toFixed(2)}/pc.
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-text-muted font-mono">
                    ${base_price.toFixed(2)}/pc.
                  </span>
                )}
              </div>
            ) : (
              <div className="mt-2 flex flex-col items-start gap-1">
                <span
                  className={`text-sm font-mono block ${
                    hasDiscount
                      ? "text-text-muted line-through"
                      : "text-text-muted"
                  }`}
                >
                  ${base_price.toFixed(2)}/pc.
                </span>

                {hasCompanyDiscount && (
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm text-accent font-semibold font-mono">
                      ${priceAfterCompany.toFixed(2)}/pc.
                    </span>
                    <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded font-medium">
                      Company −{companyPct.toFixed(0)}%
                    </span>
                  </div>
                )}

                {hasVolumeDiscount && (
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm text-green-600 font-semibold font-mono">
                      ${finalUnitPrice.toFixed(2)}/pc.
                    </span>
                    <span className="text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded font-medium">
                      Volume −{volumePct.toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>
            ))}
        </div>
        <div
          className={`flex shrink-0 ${
            compact ? "flex-col items-end gap-2" : "items-center gap-6"
          }`}
        >
          <QuantityStepper
            value={quantity}
            max={stock_quantity}
            disabled={!available || isPending}
            size={compact ? "sm" : "md"}
            onChange={(qty) => onSetQty(product_id, qty)}
          />
          <div className={`flex items-center ${compact ? "gap-2" : "gap-4"}`}>
            <div className={`flex flex-col items-end ${compact ? "" : "w-28"}`}>
              {hasDiscount && !compact && (
                <span className="text-xs text-text-muted line-through font-mono mb-0.5">
                  ${(base_price * quantity).toFixed(2)}
                </span>
              )}
              <span
                className={`font-semibold text-text-main font-mono ${
                  compact ? "text-sm" : "text-base"
                }`}
              >
                ${lineTotal.toFixed(2)}
              </span>
            </div>
            <button
              onClick={() => onRemove(product_id)}
              disabled={isPending}
              className={`text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg disabled:opacity-40 transition-colors flex items-center justify-center ${
                compact ? "p-1.5" : "p-2"
              }`}
              aria-label="Remove item"
            >
              <Trash2 size={compact ? 16 : 18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
