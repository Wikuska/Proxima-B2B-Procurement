import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export interface DataTableSelectOption {
  value: string;
  label: string;
}

interface DataTableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: DataTableSelectOption[];
  "aria-label": string;
  className?: string;
}

/** Styled filter select for DataTableShell toolbars (replaces native `<select>`). */
export default function DataTableSelect({
  value,
  onChange,
  options,
  "aria-label": ariaLabel,
  className = "",
}: DataTableSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div ref={rootRef} className={`relative shrink-0 ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((prev) => !prev)}
        className={`inline-flex w-full min-w-[11rem] items-center justify-between gap-2 rounded-lg border bg-bg-base px-3 py-2 text-sm text-text-main transition-colors ${
          open
            ? "border-primary"
            : "border-border-base/40 hover:border-border-base/70"
        }`}
      >
        <span className="truncate">{selected?.label ?? "—"}</span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-text-muted transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute left-0 right-0 z-30 mt-1.5 max-h-80 overflow-y-auto rounded-xl border border-primary bg-bg-surface py-1 shadow-lg"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <li key={option.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors ${
                    isSelected
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-text-main hover:bg-accent/10 hover:text-primary"
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && <Check size={14} className="shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
