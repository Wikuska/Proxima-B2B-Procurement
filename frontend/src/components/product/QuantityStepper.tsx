import { Minus, Plus } from "lucide-react";
import { useState } from "react";

interface QuantityStepperProps {
  value: number;
  min?: number;
  max: number;
  disabled?: boolean;
  onChange: (value: number) => void;
  onCommit?: (value: number) => void;
  /** "sm" = h-8 (compact cart), "md" = h-9 (default), "lg" = h-12 (product page) */
  size?: "sm" | "md" | "lg";
}

export default function QuantityStepper({
  value,
  min = 1,
  max,
  disabled = false,
  onChange,
  onCommit,
  size = "md",
}: QuantityStepperProps) {
  const [inputValue, setInputValue] = useState(String(value));
  const [prevValue, setPrevValue] = useState(value);

  if (value !== prevValue) {
    setPrevValue(value);
    setInputValue(String(value));
  }

  const clamp = (n: number) => Math.min(max, Math.max(min, n));

  const commit = (raw: string) => {
    const parsed = parseInt(raw, 10);
    const clamped = isNaN(parsed) ? min : clamp(parsed);
    setInputValue(String(clamped));
    if (clamped !== value) onChange(clamped);
    onCommit?.(clamped);
  };

  const step = (delta: number) => {
    const next = clamp(value + delta);
    onChange(next);
  };

  const heightClass = size === "sm" ? "h-8" : size === "lg" ? "h-12" : "h-9";
  const iconSize = size === "sm" ? 12 : 14;
  const inputWidth = size === "sm" ? "w-10 text-sm" : size === "lg" ? "w-14 text-base" : "w-12 text-base";

  return (
    <div className={`flex items-center border border-border-base/30 rounded-lg overflow-hidden ${heightClass}`}>
      <button
        type="button"
        onClick={() => step(-1)}
        disabled={disabled || value <= min}
        className="px-2.5 h-full bg-bg-surface hover:bg-border-base/10 disabled:opacity-40 transition-colors flex items-center justify-center"
      >
        <Minus size={iconSize} />
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={inputValue}
        disabled={disabled}
        onChange={(e) => setInputValue(e.target.value.replace(/\D/g, ""))}
        onBlur={() => commit(inputValue)}
        onKeyDown={(e) => e.key === "Enter" && commit(inputValue)}
        aria-label="Quantity"
        className={`h-full font-mono border-x border-border-base/30 text-center bg-bg-surface focus:outline-none focus:bg-accent/5 disabled:opacity-40 ${inputWidth}`}
      />
      <button
        type="button"
        onClick={() => step(1)}
        disabled={disabled || value >= max}
        className="px-2.5 h-full bg-bg-surface hover:bg-border-base/10 disabled:opacity-40 transition-colors flex items-center justify-center"
      >
        <Plus size={iconSize} />
      </button>
    </div>
  );
}
