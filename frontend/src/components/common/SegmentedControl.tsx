interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: SegmentOption<T>[];
  "aria-label": string;
  /** Compact fits navbar; default suits toolbars and forms. */
  size?: "sm" | "md";
}

export default function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  "aria-label": ariaLabel,
  size = "md",
}: SegmentedControlProps<T>) {
  const isSm = size === "sm";

  return (
    <div
      className={`inline-flex shrink-0 items-center gap-0.5 rounded-lg border border-border-base/30 bg-bg-base p-0.5 font-medium ${
        isSm ? "text-xs" : "text-sm"
      }`}
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-md transition-colors ${
              isSm ? "px-2.5 py-1" : "px-3 py-1.5"
            } ${
              active
                ? "bg-primary text-white shadow-sm"
                : "text-text-muted hover:text-text-main hover:bg-bg-surface"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
