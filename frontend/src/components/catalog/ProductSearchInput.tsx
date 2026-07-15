import { useEffect, useId, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { useDebouncedValue } from "../../hooks/common/useDebouncedValue";
import { useProductSuggestions } from "../../hooks/catalog/useProductSuggestions";
import ProductSearchDropdown from "./ProductSearchDropdown";

interface ProductSearchInputProps {
  defaultValue?: string;
  onSearch: (term: string) => void;
  onClose?: () => void;
  autoFocus?: boolean;
  size?: "sm" | "lg" | "nav";
  showSuggestions?: boolean;
}

const MIN_QUERY_LENGTH = 2;

export default function ProductSearchInput({
  defaultValue = "",
  onSearch,
  onClose,
  autoFocus = false,
  size = "sm",
  showSuggestions = true,
}: ProductSearchInputProps) {
  const inputId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [prevDefaultValue, setPrevDefaultValue] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQ = useDebouncedValue(value.trim(), 300);
  const { data, isLoading, isFetching } = useProductSuggestions(debouncedQ);

  if (defaultValue !== prevDefaultValue) {
    setPrevDefaultValue(defaultValue);
    setValue(defaultValue);
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const canSuggest =
    showSuggestions && debouncedQ.length >= MIN_QUERY_LENGTH && isOpen;

  const submitSearch = () => {
    const trimmed = value.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) return;
    setIsOpen(false);
    onSearch(trimmed);
  };

  const inputClassName =
    size === "lg"
      ? "w-full rounded-lg border border-border-base/30 bg-bg-surface px-4 py-3 pr-12 text-base text-text-main placeholder:text-text-muted focus:outline-none focus:border-border-focus"
      : size === "nav"
        ? "w-full rounded-md border border-border-base/25 bg-bg-base px-3 py-1.5 pr-9 text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:border-border-focus focus:bg-bg-surface"
        : "w-full rounded-lg border border-border-base/30 bg-bg-surface px-4 py-2.5 pr-11 text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:border-border-focus";

  return (
    <div ref={containerRef} className="relative w-full">
      <label htmlFor={inputId} className="sr-only">
        Search products
      </label>
      <div className="relative">
        <input
          id={inputId}
          type="search"
          value={value}
          autoFocus={autoFocus}
          placeholder="Search by name or product code…"
          className={inputClassName}
          onChange={(event) => {
            setValue(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              if (onClose) {
                onClose();
              } else {
                setIsOpen(false);
              }
              return;
            }
            if (event.key === "Enter") {
              event.preventDefault();
              submitSearch();
            }
          }}
        />
        <button
          type="button"
          onClick={onClose ?? submitSearch}
          aria-label={onClose ? "Close search" : "Search"}
          className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-md text-text-muted hover:text-accent transition-colors ${
            size === "lg" ? "p-2" : size === "nav" ? "p-1" : "p-1.5"
          }`}
        >
          {onClose ? (
            <X size={size === "nav" ? 18 : size === "lg" ? 20 : 18} />
          ) : (
            <Search size={size === "lg" ? 20 : size === "nav" ? 16 : 18} />
          )}
        </button>
      </div>

      {canSuggest && (
        <ProductSearchDropdown
          query={debouncedQ}
          items={data?.items ?? []}
          isLoading={isLoading || isFetching}
          onSelectProduct={() => setIsOpen(false)}
          onSeeAll={submitSearch}
        />
      )}
    </div>
  );
}
