import { usePurchaseModeStore } from "../../store/purchaseModeStore";
import { useAuth } from "../../hooks/user/useAuth";

export default function PurchaseModeToggle() {
  const { user } = useAuth();
  const { mode, setMode } = usePurchaseModeStore();

  if (!user?.company_id) return null;

  return (
    <div className="flex items-center gap-1 bg-bg-base border border-border-base/30 rounded-lg p-0.5 text-xs font-medium">
      <button
        onClick={() => setMode("COMPANY")}
        className={`px-2.5 py-1 rounded-md transition-colors ${
          mode === "COMPANY"
            ? "bg-primary text-white"
            : "text-text-muted hover:text-text-main"
        }`}
      >
        Company
      </button>
      <button
        onClick={() => setMode("PRIVATE")}
        className={`px-2.5 py-1 rounded-md transition-colors ${
          mode === "PRIVATE"
            ? "bg-primary text-white"
            : "text-text-muted hover:text-text-main"
        }`}
      >
        Private
      </button>
    </div>
  );
}
