import { useState } from "react";
import { toast } from "sonner";
import { useCartActions } from "../../hooks/cart/useCartActions";
import { useCartStore } from "../../store/cartStore";
import { useAuth } from "../../hooks/user/useAuth";

interface AddToCartProps {
  productId: string;
  stock: number;
  isB2bOnly: boolean;
}

export default function AddToCart({ productId, stock, isB2bOnly }: AddToCartProps) {
  const { user } = useAuth();
  const inCart = useCartStore((s) => s.getQuantity(productId));
  const { add, pendingProductIds } = useCartActions();
  const isPending = pendingProductIds.has(productId);

  const b2bBlocked = isB2bOnly && !user?.company_id;
  const maxAddable = Math.max(0, stock - inCart);

  const [quantity, setQuantity] = useState<number>(1);

  const handleDecrement = () => setQuantity((prev) => Math.max(1, prev - 1));
  const handleIncrement = () => setQuantity((prev) => Math.min(maxAddable, prev + 1));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (isNaN(value) || value < 1) {
      setQuantity(1);
    } else if (value > maxAddable) {
      setQuantity(maxAddable);
    } else {
      setQuantity(value);
    }
  };

  const handleAddToCart = async () => {
    if (b2bBlocked) {
      toast.error("Available to company accounts only");
      return;
    }
    await add(productId, quantity);
    setQuantity(1);
  };

  const outOfStock = stock <= 0;
  const disabled = b2bBlocked || outOfStock || inCart >= stock;

  return (
    <div className="flex flex-wrap items-end gap-4 mt-2 bg-bg-surface p-5 border border-border-base/20 rounded-xl">
      <div className="flex flex-col gap-2">
        <label htmlFor="quantity" className="text-xs font-medium text-text-muted">
          Quantity:
        </label>
        <div className="flex items-center border border-border-base/40 rounded-lg overflow-hidden h-12 bg-bg-surface">
          <button
            type="button"
            onClick={handleDecrement}
            disabled={quantity <= 1 || disabled || isPending}
            className="px-4 h-full bg-bg-base hover:bg-accent/10 disabled:opacity-50 transition-colors font-medium"
          >
            -
          </button>
          <input
            id="quantity"
            type="number"
            min="1"
            max={maxAddable}
            value={quantity}
            onChange={handleInputChange}
            disabled={disabled || isPending}
            className="w-14 text-center h-full border-x border-border-base/40 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-mono"
          />
          <button
            type="button"
            onClick={handleIncrement}
            disabled={quantity >= maxAddable || disabled || isPending}
            className="px-4 h-full bg-bg-base hover:bg-accent/10 disabled:opacity-50 transition-colors font-medium"
          >
            +
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={handleAddToCart}
        disabled={disabled || isPending}
        className="flex-1 min-w-[200px] h-12 bg-primary hover:bg-accent disabled:bg-border-base/40 disabled:text-text-muted text-white font-semibold px-6 rounded-lg transition-colors"
      >
        {isPending
          ? "Adding…"
          : b2bBlocked
            ? "Company accounts only"
            : inCart >= stock
              ? "Max quantity in cart"
              : "Add to cart"}
      </button>
    </div>
  );
}
