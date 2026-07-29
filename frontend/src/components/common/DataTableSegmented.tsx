interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface DataTableSegmentedProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: SegmentOption<T>[];
  "aria-label": string;
}

/** Compact segmented filter matching PurchaseModeSelector chrome. */
export default function DataTableSegmented<T extends string>({
  value,
  onChange,
  options,
  "aria-label": ariaLabel,
}: DataTableSegmentedProps<T>) {
  return (
    <div
      className="inline-flex shrink-0 items-center gap-0.5 rounded-lg border border-border-base/30 bg-bg-base p-0.5 text-sm font-medium"
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
            className={`rounded-md px-3 py-1.5 transition-colors ${
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
