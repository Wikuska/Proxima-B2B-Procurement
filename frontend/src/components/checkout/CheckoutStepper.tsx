import { useLocation } from "react-router-dom";

const STEPS = ["Shipping", "Document", "Review"];
const STEP_PATHS = ["shipping", "document", "review"];

function stepFromPathname(pathname: string): 1 | 2 | 3 {
  const index = STEP_PATHS.findIndex((path) => pathname.endsWith(path));
  return ((index === -1 ? 0 : index) + 1) as 1 | 2 | 3;
}

export default function CheckoutStepper() {
  const { pathname } = useLocation();
  const currentStep = stepFromPathname(pathname);

  return (
    <ol className="flex items-center gap-0 mb-10">
      {STEPS.map((label, i) => {
        const stepNum = (i + 1) as 1 | 2 | 3;
        const isActive = stepNum === currentStep;
        const isDone = stepNum < currentStep;
        return (
          <li key={label} className="flex items-center">
            <div className="flex items-center gap-2">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                  isDone
                    ? "bg-primary border-primary text-white"
                    : isActive
                      ? "border-primary text-primary bg-bg-surface"
                      : "border-border-base text-text-muted bg-bg-surface"
                }`}
              >
                {isDone ? "✓" : stepNum}
              </span>
              <span
                className={`text-sm font-medium hidden sm:block ${
                  isActive ? "text-text-main" : "text-text-muted"
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="w-12 h-px bg-border-base/40 mx-3" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
