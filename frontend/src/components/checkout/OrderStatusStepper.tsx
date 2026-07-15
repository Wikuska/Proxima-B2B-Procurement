import { ORDER_STATUS_LABELS, type OrderStatus } from "../../api/order";

const LIFECYCLE_STEPS: OrderStatus[] = [
  "PENDING_PAYMENT",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
];

interface OrderStatusStepperProps {
  status: OrderStatus;
}

export default function OrderStatusStepper({ status }: OrderStatusStepperProps) {
  const currentIndex = LIFECYCLE_STEPS.indexOf(status);
  const isTerminal = status === "CANCELLED" || status === "RETURNED";

  if (isTerminal) {
    return (
      <div className="rounded-lg border border-border-base/30 bg-bg-base px-4 py-3 text-sm text-text-muted">
        Order status:{" "}
        <span className="font-medium text-text-main">{ORDER_STATUS_LABELS[status]}</span>
      </div>
    );
  }

  return (
    <ol className="flex items-center justify-between gap-1">
      {LIFECYCLE_STEPS.map((step, index) => {
        const isComplete = currentIndex > index;
        const isCurrent = currentIndex === index;
        const isUpcoming = currentIndex < index;

        return (
          <li key={step} className="flex flex-1 flex-col items-center gap-1.5 min-w-0">
            <div
              className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                isComplete
                  ? "bg-primary"
                  : isCurrent
                    ? "bg-accent ring-4 ring-accent/20"
                    : "bg-border-base/40"
              }`}
            />
            <span
              className={`text-[10px] leading-tight text-center uppercase tracking-wide ${
                isCurrent
                  ? "font-semibold text-primary"
                  : isUpcoming
                    ? "text-text-muted"
                    : "text-text-main"
              }`}
            >
              {ORDER_STATUS_LABELS[step]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
