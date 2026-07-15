import ProductSearchInput from "../catalog/ProductSearchInput";

interface NavSearchPanelProps {
  onSearch: (term: string) => void;
}

export default function NavSearchPanel({ onSearch }: NavSearchPanelProps) {
  return (
    <div className="border-t border-border-base/10 bg-bg-surface animate-pop-down">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <ProductSearchInput
          autoFocus
          showSuggestions
          onSearch={onSearch}
        />
      </div>
    </div>
  );
}
