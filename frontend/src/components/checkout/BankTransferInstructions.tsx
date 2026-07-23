import { DEMO_BANK_DETAILS, formatTransferTitle } from "../../config/payment";
import { useConfirmPayment } from "../../hooks/order/useOrders";
import Panel from "../common/Panel";

interface BankTransferInstructionsProps {
  orderId: string;
  totalAmount: string;
  showConfirmButton?: boolean;
}

export default function BankTransferInstructions({
  orderId,
  totalAmount,
  showConfirmButton = true,
}: BankTransferInstructionsProps) {
  const confirmPayment = useConfirmPayment(orderId);

  return (
    <Panel
      title="Bank transfer instructions"
      description="Transfer the exact amount to the account below. Use the transfer title so we can match your payment."
      stacked
      className="space-y-3 text-left"
    >
      <dl className="space-y-2 text-sm">
        <div>
          <dt className="text-text-muted">Bank</dt>
          <dd className="font-medium text-text-main">{DEMO_BANK_DETAILS.bankName}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Account holder</dt>
          <dd className="font-medium text-text-main">{DEMO_BANK_DETAILS.accountHolder}</dd>
        </div>
        <div>
          <dt className="text-text-muted">IBAN</dt>
          <dd className="font-mono font-medium text-text-main">{DEMO_BANK_DETAILS.iban}</dd>
        </div>
        <div>
          <dt className="text-text-muted">SWIFT</dt>
          <dd className="font-mono font-medium text-text-main">{DEMO_BANK_DETAILS.swift}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Amount</dt>
          <dd className="font-mono font-medium text-text-main">
            ${Number(totalAmount).toFixed(2)}
          </dd>
        </div>
        <div>
          <dt className="text-text-muted">Transfer title</dt>
          <dd className="font-mono font-medium text-text-main">
            {formatTransferTitle(orderId)}
          </dd>
        </div>
      </dl>
      {showConfirmButton && (
        <button
          type="button"
          onClick={() => confirmPayment.mutate()}
          disabled={confirmPayment.isPending}
          className="mt-2 w-full px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-accent transition-colors disabled:opacity-60"
        >
          {confirmPayment.isPending ? "Confirming…" : "I've made the transfer"}
        </button>
      )}
    </Panel>
  );
}
