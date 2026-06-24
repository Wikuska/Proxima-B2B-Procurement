import { useState } from "react";

interface AddToCartProps {
  stock: number;
  disabled?: boolean;
}

export default function AddToCart({ stock, disabled }: AddToCartProps) {
  const [quantity, setQuantity] = useState<number>(1);

  const handleDecrement = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleIncrement = () => {
    setQuantity((prev) => Math.min(stock, prev + 1));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (isNaN(value) || value < 1) {
      setQuantity(1);
    } else if (value > stock) {
      setQuantity(stock);
    } else {
      setQuantity(value);
    }
  };

  const handleAddToCart = () => {
    console.log(`Added ${quantity} items to cart.`);
  };

  return (
    <div
      className={`flex flex-wrap items-end gap-4 mt-2 bg-bg-surface p-5 border border-border-base/20 rounded-xl ${disabled ? "opacity-60 pointer-events-none" : ""}`}
    >
      {/* Quantity Selector Container */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="quantity"
          className="text-xs font-medium text-text-muted"
        >
          Quantity:
        </label>
        <div className="flex items-center border border-border-base/40 rounded-lg overflow-hidden h-12 bg-white">
          <button
            type="button"
            onClick={handleDecrement}
            disabled={quantity <= 1 || disabled}
            className="px-4 h-full bg-gray-50 hover:bg-gray-100 disabled:opacity-50 transition-colors font-medium"
          >
            -
          </button>
          <input
            id="quantity"
            type="number"
            min="1"
            max={stock}
            value={quantity}
            onChange={handleInputChange}
            disabled={disabled}
            className="w-14 text-center h-full border-x border-border-base/40 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-mono"
          />
          <button
            type="button"
            onClick={handleIncrement}
            disabled={quantity >= stock || disabled}
            className="px-4 h-full bg-gray-50 hover:bg-gray-100 disabled:opacity-50 transition-colors font-medium"
          >
            +
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={handleAddToCart}
        disabled={disabled || stock <= 0}
        className="flex-1 min-w-[200px] h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold px-6 rounded-lg transition-colors"
      >
        {disabled ? "Unavailable" : "Add to cart"}
      </button>
    </div>
  );
}
