import { Minus, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { UNAVAILABLE_REASON_LABEL } from "../../utils/cartEligibility";
import type { CartLineItem as CartLine } from "../../hooks/cart/useCartView";

interface CartLineItemProps {
  line: CartLine;
  showCheckbox?: boolean;
  onSetQty: (product_id: string, qty: number) => void;
  onRemove: (product_id: string) => void;
  onToggleSelect?: (product_id: string) => void;
  isPending: boolean;
}

export default function CartLineItem({
  line,
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

  return (
    <div
      className={`flex items-start gap-3 py-3 ${!available ? "opacity-50" : ""}`}
    >
      {showCheckbox && (
        <input
          type="checkbox"
          checked={selected && available}
          disabled={!available}
          onChange={() => onToggleSelect?.(product_id)}
          className="mt-1 accent-primary"
        />
      )}

      <div className="w-14 h-14 flex-shrink-0 rounded-lg border border-border-base/20 bg-bg-base flex items-center justify-center overflow-hidden">
        {main_image_url ? (
          <img src={main_image_url} alt={name} className="w-full h-full object-contain p-1" />
        ) : (
          <span className="text-[10px] text-text-muted text-center">No image</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <Link
          to={`/product/${slug}`}
          className="text-sm font-medium text-text-main hover:text-accent truncate block"
        >
          {name}
        </Link>

        {!available && unavailableReason && (
          <p className="text-xs text-red-500 mt-0.5">
            {UNAVAILABLE_REASON_LABEL[unavailableReason as keyof typeof UNAVAILABLE_REASON_LABEL]}
          </p>
        )}

        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center border border-border-base/30 rounded-lg overflow-hidden">
            <button
              onClick={() => onSetQty(product_id, quantity - 1)}
              disabled={!available || quantity <= 1 || isPending}
              className="px-2 py-1 bg-bg-base hover:bg-accent/10 disabled:opacity-40 transition-colors"
            >
              <Minus size={12} />
            </button>
            <span className="px-3 py-1 text-sm font-mono border-x border-border-base/30 min-w-[2rem] text-center">
              {quantity}
            </span>
            <button
              onClick={() => onSetQty(product_id, quantity + 1)}
              disabled={!available || quantity >= stock_quantity || isPending}
              className="px-2 py-1 bg-bg-base hover:bg-accent/10 disabled:opacity-40 transition-colors"
            >
              <Plus size={12} />
            </button>
          </div>

          <span className="text-sm font-semibold text-text-main ml-auto">
            ${(base_price * quantity).toFixed(2)}
          </span>

          <button
            onClick={() => onRemove(product_id)}
            disabled={isPending}
            className="p-1 text-text-muted hover:text-red-500 disabled:opacity-40 transition-colors"
            aria-label="Remove item"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
