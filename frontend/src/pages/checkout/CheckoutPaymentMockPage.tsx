import { CreditCard, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PAYMENT_LABELS } from "../../api/order";
import { useMockPayment, useOrder } from "../../hooks/order/useOrders";

export default function CheckoutPaymentMockPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { data: order, isLoading } = useOrder(orderId ?? "");
  const mockPayment = useMockPayment(orderId ?? "");
  const [showFailure, setShowFailure] = useState(false);

  useEffect(() => {
    if (!order || !orderId) return;
    if (order.status !== "PENDING_PAYMENT") {
      navigate(`/checkout/confirmation/${orderId}`, { replace: true });
    }
  }, [order, orderId, navigate]);

  if (isLoading || !order) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center text-text-muted">
        Loading…
      </div>
    );
  }

  function handleResult(success: boolean) {
    setShowFailure(false);
    mockPayment.mutate(success, {
      onSuccess: (_, result) => {
        if (!result) setShowFailure(true);
      },
    });
  }

  return (
    <div className="max-w-md mx-auto px-4 py-14">
      <div className="bg-bg-surface border border-border-base/20 rounded-2xl p-8 shadow-sm text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <CreditCard className="text-primary" size={28} />
        </div>
        <p className="text-xs uppercase tracking-wider text-text-muted mb-1">
          External payment gateway (demo)
        </p>
        <h1 className="text-xl font-bold text-text-main mb-2">
          {PAYMENT_LABELS[order.payment_method]}
        </h1>
        <p className="text-sm text-text-muted mb-6">
          Order #{order.id.slice(0, 8).toUpperCase()} · $
          {Number(order.total_amount).toFixed(2)}
        </p>

        {showFailure && (
          <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-600">
            Payment failed. You can try again or view your order details.
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => handleResult(true)}
            disabled={mockPayment.isPending}
            className="w-full px-6 py-3 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-accent transition-colors disabled:opacity-60"
          >
            {mockPayment.isPending ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Processing…
              </span>
            ) : (
              "Simulate success"
            )}
          </button>
          <button
            type="button"
            onClick={() => handleResult(false)}
            disabled={mockPayment.isPending}
            className="w-full px-6 py-3 border border-border-base/40 text-text-main rounded-lg text-sm font-semibold hover:border-red-500/40 hover:text-red-600 transition-colors disabled:opacity-60"
          >
            Simulate failure
          </button>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-text-muted">
        <Link
          to={`/profile/orders/${order.id}`}
          className="text-primary hover:underline"
        >
          View order details
        </Link>
      </p>
    </div>
  );
}
