import { useLocation } from "react-router-dom";

const STEPS = ["Your data", "Delivery & payment", "Summary"];
const STEP_PATHS = ["details", "delivery", "summary"];

function stepFromPathname(pathname: string): 1 | 2 | 3 {
  const index = STEP_PATHS.findIndex((path) => pathname.endsWith(path));
  return ((index === -1 ? 0 : index) + 1) as 1 | 2 | 3;
}

export default function CheckoutStepper() {
  const { pathname } = useLocation();
  const currentStep = stepFromPathname(pathname);
  const n = STEPS.length;
  // Circle centers sit at the middle of each equal-width column, i.e. at
  // (i + 0.5) / n of the track — so the connector lines below are anchored
  // to those exact points rather than to variable-width label content.
  const edgeInset = 50 / n;
  const trackWidth = 100 - 2 * edgeInset;
  const progress = (trackWidth * (currentStep - 1)) / (n - 1);

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div
        className="absolute top-3.5 h-px bg-border-base/40"
        style={{ left: `${edgeInset}%`, right: `${edgeInset}%` }}
      />
      <div
        className="absolute top-3.5 h-px bg-primary transition-all"
        style={{ left: `${edgeInset}%`, width: `${progress}%` }}
      />
      <ol className="relative flex">
        {STEPS.map((label, i) => {
          const stepNum = (i + 1) as 1 | 2 | 3;
          const isActive = stepNum === currentStep;
          const isDone = stepNum < currentStep;
          return (
            <li key={label} className="flex-1 flex flex-col items-center gap-2">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                  isDone || isActive
                    ? "bg-primary border-primary text-white"
                    : "border-border-base text-text-muted bg-bg-surface"
                }`}
              >
                {isDone ? "✓" : stepNum}
              </span>
              <span
                className={`text-xs font-medium text-center px-1 ${
                  isActive ? "text-primary" : "text-text-muted"
                }`}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
