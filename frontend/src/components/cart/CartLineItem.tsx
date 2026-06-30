import { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { UNAVAILABLE_REASON_LABEL } from "../../utils/cartEligibility";
import type { CartLineItem as CartLine } from "../../hooks/cart/useCartView";
import type { LinePricingOut } from "../../api/pricing";

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

  const [inputValue, setInputValue] = useState(String(quantity));
  const [prevQuantity, setPrevQuantity] = useState(quantity);

  if (quantity !== prevQuantity) {
    setPrevQuantity(quantity);
    setInputValue(String(quantity));
  }

  const commitQty = () => {
    const parsed = parseInt(inputValue, 10);
    if (isNaN(parsed) || parsed < 1) {
      onSetQty(product_id, 1);
      setInputValue("1");
    } else if (parsed > stock_quantity) {
      onSetQty(product_id, stock_quantity);
      setInputValue(String(stock_quantity));
    } else {
      onSetQty(product_id, parsed);
      setInputValue(String(parsed));
    }
  };

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
      <div
        className={`flex-shrink-0 rounded-lg border border-border-base/20 bg-bg-surface flex items-center justify-center overflow-hidden ${
          compact ? "w-16 h-16 p-1.5" : "w-24 h-24 p-2"
        }`}
      >
        {main_image_url ? (
          <img
            src={main_image_url}
            alt={name}
            className="w-full h-full object-contain mix-blend-multiply"
          />
        ) : (
          <span className="text-[10px] text-text-muted text-center leading-tight px-1">
            No image
          </span>
        )}
      </div>
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
          <div
            className={`flex items-center border border-border-base/30 rounded-lg overflow-hidden ${
              compact ? "h-8" : "h-9"
            }`}
          >
            <button
              onClick={() => onSetQty(product_id, quantity - 1)}
              disabled={!available || quantity <= 1 || isPending}
              className="px-2.5 h-full bg-bg-surface hover:bg-border-base/10 disabled:opacity-40 transition-colors flex items-center justify-center"
            >
              <Minus size={14} />
            </button>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={inputValue}
              disabled={!available || isPending}
              onChange={(e) => setInputValue(e.target.value.replace(/\D/g, ""))}
              onBlur={commitQty}
              onKeyDown={(e) => e.key === "Enter" && commitQty()}
              className={`h-full font-mono border-x border-border-base/30 text-center bg-bg-surface focus:outline-none focus:bg-accent/5 disabled:opacity-40 ${
                compact ? "w-10 text-sm" : "w-12 text-base"
              }`}
              aria-label="Quantity"
            />
            <button
              onClick={() => onSetQty(product_id, quantity + 1)}
              disabled={!available || quantity >= stock_quantity || isPending}
              className="px-2.5 h-full bg-bg-surface hover:bg-border-base/10 disabled:opacity-40 transition-colors flex items-center justify-center"
            >
              <Plus size={14} />
            </button>
          </div>
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
