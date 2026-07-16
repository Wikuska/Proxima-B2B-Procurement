import { ORDER_STATUS_LABELS, type OrderStatus } from "../../api/order";

/** Happy-path fulfillment steps. Unpaid orders sit on Awaiting payment; after any
 * successful payment (or COD/deferred) they move straight to Processing. */
const LIFECYCLE_STEPS: OrderStatus[] = [
  "PENDING_PAYMENT",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
];

interface OrderStatusStepperProps {
  status: OrderStatus;
}

/** Map statuses onto the displayed lifecycle (legacy PAID ≈ past Payment). */
function lifecycleIndex(status: OrderStatus): number {
  if (status === "PAID") return LIFECYCLE_STEPS.indexOf("PROCESSING");
  return LIFECYCLE_STEPS.indexOf(status);
}

export default function OrderStatusStepper({ status }: OrderStatusStepperProps) {
  const currentIndex = lifecycleIndex(status);
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
