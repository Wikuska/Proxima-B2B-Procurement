import { CheckCircle, Clock } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { DELIVERY_LABELS, ORDER_STATUS_LABELS, PAYMENT_LABELS } from "../../api/order";
import BankTransferInstructions from "../../components/checkout/BankTransferInstructions";
import { useOrder } from "../../hooks/order/useOrders";

function ConfirmationHero({
  status,
  paymentMethod,
}: {
  status: string;
  paymentMethod: string;
}) {
  if (status === "PENDING_PAYMENT") {
    if (paymentMethod === "BANK_TRANSFER") {
      return (
        <>
          <Clock className="mx-auto mb-5 text-yellow-500" size={56} strokeWidth={1.5} />
          <h1 className="text-2xl font-bold text-text-main mb-2">Awaiting payment</h1>
          <p className="text-sm text-text-muted mb-6">
            Your order has been placed. Complete the bank transfer to start processing.
          </p>
        </>
      );
    }
    return (
      <>
        <Clock className="mx-auto mb-5 text-yellow-500" size={56} strokeWidth={1.5} />
        <h1 className="text-2xl font-bold text-text-main mb-2">Awaiting payment</h1>
        <p className="text-sm text-text-muted mb-6">
          Your order has been placed. Complete payment to start processing.
        </p>
      </>
    );
  }

  return (
    <>
      <CheckCircle className="mx-auto mb-5 text-green-500" size={56} strokeWidth={1.5} />
      <h1 className="text-2xl font-bold text-text-main mb-2">Order placed!</h1>
      <p className="text-sm text-text-muted mb-6">
        {status === "PREPARING"
          ? "Your order is being prepared."
          : "Thank you for your order."}
      </p>
    </>
  );
}

export default function CheckoutConfirmationPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { data: order, isLoading } = useOrder(orderId ?? "");

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center text-text-muted">
        Loading…
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center text-text-muted">
        Order not found.
      </div>
    );
  }

  const showBankTransfer =
    order.status === "PENDING_PAYMENT" && order.payment_method === "BANK_TRANSFER";

  return (
    <div className="max-w-xl mx-auto px-4 py-14 text-center">
      <ConfirmationHero status={order.status} paymentMethod={order.payment_method} />

      <p className="text-sm text-text-muted mb-6">
        Order #{order.id.slice(0, 8).toUpperCase()} · Total $
        {Number(order.total_amount).toFixed(2)} ·{" "}
        <span className="font-medium text-text-main">
          {ORDER_STATUS_LABELS[order.status]}
        </span>
      </p>

      {showBankTransfer && (
        <div className="mb-8 text-left">
          <BankTransferInstructions
            orderId={order.id}
            totalAmount={order.total_amount}
          />
        </div>
      )}

      <div className="bg-bg-surface border border-border-base/20 rounded-2xl p-6 text-left shadow-sm mb-8">
        <h2 className="text-sm font-semibold text-text-main mb-3">Items ordered</h2>
        <div className="divide-y divide-border-base/10">
          {order.items.map((item) => (
            <div key={item.id} className="py-2.5 flex justify-between gap-4">
              <div>
                <p className="text-sm text-text-main">{item.product_name}</p>
                <p className="text-xs text-text-muted">
                  {item.product_sku} · qty {item.quantity}
                </p>
              </div>
              <p className="text-sm font-mono text-text-main whitespace-nowrap">
                ${(Number(item.unit_price) * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
        <div className="border-t border-border-base/10 mt-3 pt-3 space-y-1.5">
          <div className="flex justify-between text-xs text-text-muted">
            <span>Shipping ({DELIVERY_LABELS[order.shipment.delivery_method]})</span>
            <span className="font-mono">
              {Number(order.shipment.shipping_cost) === 0
                ? "Free"
                : `$${Number(order.shipment.shipping_cost).toFixed(2)}`}
            </span>
          </div>
          <div className="flex justify-between pt-1">
            <span className="text-sm font-bold text-text-main">Total</span>
            <span className="text-sm font-bold font-mono text-text-main">
              ${Number(order.total_amount).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-bg-surface border border-border-base/20 rounded-2xl p-6 text-left shadow-sm mb-8 space-y-1.5">
        <h2 className="text-sm font-semibold text-text-main mb-2">Delivery</h2>
        <p className="text-sm text-text-muted">
          <span className="font-medium text-text-main">Recipient:</span>{" "}
          {order.shipment.recipient_name} · {order.shipment.recipient_phone}
        </p>
        <p className="text-sm text-text-muted">
          <span className="font-medium text-text-main">Ship to:</span>{" "}
          {order.shipment.shipping_street}, {order.shipment.shipping_city}{" "}
          {order.shipment.shipping_postal_code}, {order.shipment.shipping_country}
        </p>
        <p className="text-sm text-text-muted">
          <span className="font-medium text-text-main">Method:</span>{" "}
          {DELIVERY_LABELS[order.shipment.delivery_method]}
        </p>
        <p className="text-sm text-text-muted">
          <span className="font-medium text-text-main">Payment:</span>{" "}
          {PAYMENT_LABELS[order.payment_method]}
        </p>
        {order.note && (
          <p className="text-sm text-text-muted">
            <span className="font-medium text-text-main">Note:</span> {order.note}
          </p>
        )}
      </div>

      <div className="flex gap-3 justify-center">
        <Link
          to={`/profile/orders/${order.id}`}
          className="px-6 py-2.5 border border-primary text-primary rounded-lg text-sm font-semibold hover:bg-primary hover:text-white transition-colors"
        >
          View Order
        </Link>
        <Link
          to="/catalog"
          className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-accent transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
