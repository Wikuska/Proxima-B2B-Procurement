import type { PurchaseMode } from "../../store/purchaseModeStore";
import { usePurchaseModeStore } from "../../store/purchaseModeStore";

interface PurchaseModeSelectorProps {
  variant?: "compact" | "card";
}

export default function PurchaseModeSelector({
  variant = "compact",
}: PurchaseModeSelectorProps) {
  const { mode, setMode } = usePurchaseModeStore();

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-1 bg-bg-base border border-border-base/30 rounded-lg p-0.5 text-xs font-medium">
        <ModeButton
          label="Company"
          active={mode === "COMPANY"}
          onClick={() => setMode("COMPANY")}
        />
        <ModeButton
          label="Private"
          active={mode === "PRIVATE"}
          onClick={() => setMode("PRIVATE")}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-text-main">Purchasing as</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <CardOption
          title="Company"
          description="Company pricing, company shipping address, company invoice"
          active={mode === "COMPANY"}
          onClick={() => setMode("COMPANY")}
        />
        <CardOption
          title="Private"
          description="Standard pricing, personal address, receipt or personal invoice"
          active={mode === "PRIVATE"}
          onClick={() => setMode("PRIVATE")}
        />
      </div>
    </div>
  );
}

function ModeButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 rounded-md transition-colors ${
        active
          ? "bg-primary text-white"
          : "text-text-muted hover:text-text-main"
      }`}
    >
      {label}
    </button>
  );
}

function CardOption({
  title,
  description,
  active,
  onClick,
}: {
  title: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left p-4 rounded-xl border transition-colors ${
        active
          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
          : "border-border-base/30 hover:border-primary/40"
      }`}
    >
      <p
        className={`text-sm font-semibold ${active ? "text-primary" : "text-text-main"}`}
      >
        {title}
      </p>
      <p className="text-xs text-text-muted mt-1">{description}</p>
    </button>
  );
}

export function usePurchaseModeValue(): PurchaseMode {
  return usePurchaseModeStore((s) => s.mode);
}
