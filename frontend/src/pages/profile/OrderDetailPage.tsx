import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import {
  DELIVERY_LABELS,
  ORDER_STATUS_LABELS,
  PAYMENT_LABELS,
  type BillingDocumentOut,
  type ShipmentOut,
} from "../../api/order";
import BankTransferInstructions from "../../components/checkout/BankTransferInstructions";
import OrderStatusStepper from "../../components/checkout/OrderStatusStepper";
import { useAdvanceOrderStatus, useOrder } from "../../hooks/order/useOrders";
import { useAuth } from "../../hooks/user/useAuth";

const DOC_TYPE_LABEL: Record<string, string> = {
  RECEIPT: "Receipt",
  PERSONAL_INVOICE: "Personal Invoice",
  COMPANY_INVOICE: "Company Invoice",
};

const ADMIN_ADVANCE_LABELS: Record<string, string> = {
  PAID: "Start processing",
  PROCESSING: "Mark as shipped",
  SHIPPED: "Mark as delivered",
};

function BillingDocumentSection({ doc }: { doc: BillingDocumentOut }) {
  return (
    <section className="bg-bg-base border border-border-base/40 rounded-lg p-5 shadow-sm space-y-2">
      <h3 className="text-sm font-semibold text-text-main mb-3">Billing Document</h3>
      <p className="text-xs text-text-muted">
        <span className="font-medium text-text-main">Type:</span>{" "}
        {DOC_TYPE_LABEL[doc.document_type] ?? doc.document_type}
      </p>
      {doc.company_name && (
        <p className="text-xs text-text-muted">
          <span className="font-medium text-text-main">Company:</span> {doc.company_name}
        </p>
      )}
      {doc.company_nip && (
        <p className="text-xs text-text-muted font-mono">
          <span className="font-medium text-text-main not-font-mono">NIP:</span> {doc.company_nip}
        </p>
      )}
      {doc.first_name && doc.last_name && (
        <p className="text-xs text-text-muted">
          <span className="font-medium text-text-main">Name:</span> {doc.first_name} {doc.last_name}
        </p>
      )}
      {doc.billing_street && (
        <p className="text-xs text-text-muted">
          <span className="font-medium text-text-main">Billing address:</span>{" "}
          {doc.billing_street}, {doc.billing_city} {doc.billing_postal_code},{" "}
          {doc.billing_country}
        </p>
      )}
      {doc.document_number && (
        <p className="text-xs text-text-muted font-mono">
          <span className="font-medium text-text-main not-font-mono">Invoice #:</span>{" "}
          {doc.document_number}
        </p>
      )}
    </section>
  );
}

function ShipmentSection({
  shipment,
  paymentMethod,
}: {
  shipment: ShipmentOut;
  paymentMethod: string;
}) {
  return (
    <section className="bg-bg-base border border-border-base/40 rounded-lg p-5 shadow-sm space-y-2">
      <h3 className="text-sm font-semibold text-text-main mb-3">Delivery</h3>
      <p className="text-sm text-text-muted">
        <span className="font-medium text-text-main">Recipient:</span>{" "}
        {shipment.recipient_name} · {shipment.recipient_phone}
        {shipment.recipient_email && <> · {shipment.recipient_email}</>}
      </p>
      <p className="text-sm text-text-muted">
        <span className="font-medium text-text-main">Ship to:</span>{" "}
        {shipment.shipping_street}, {shipment.shipping_city}{" "}
        {shipment.shipping_postal_code}, {shipment.shipping_country}
      </p>
      <p className="text-sm text-text-muted">
        <span className="font-medium text-text-main">Method:</span>{" "}
        {DELIVERY_LABELS[shipment.delivery_method]}
      </p>
      <p className="text-sm text-text-muted">
        <span className="font-medium text-text-main">Payment:</span>{" "}
        {PAYMENT_LABELS[paymentMethod as keyof typeof PAYMENT_LABELS] ?? paymentMethod}
      </p>
    </section>
  );
}

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { data: order, isLoading, isError } = useOrder(orderId ?? "");
  const { isAdmin } = useAuth();
  const advanceStatus = useAdvanceOrderStatus(orderId ?? "");

  if (isLoading) return <p className="text-sm text-text-muted">Loading…</p>;
  if (isError || !order) return <p className="text-sm text-red-500">Order not found.</p>;

  const showBankTransfer =
    order.status === "PENDING_PAYMENT" && order.payment_method === "BANK_TRANSFER";
  const showPaymentRetry =
    order.status === "PENDING_PAYMENT" &&
    (order.payment_method === "CARD" || order.payment_method === "BLIK");
  const adminAdvanceLabel = ADMIN_ADVANCE_LABELS[order.status];

  return (
    <div className="space-y-6 max-w-2xl">
      <Link
        to="/profile/orders"
        className="flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors"
      >
        <ArrowLeft size={14} />
        Back to orders
      </Link>

      <div>
        <h2 className="text-lg font-bold text-text-main">
          Order #{order.id.slice(0, 8).toUpperCase()}
        </h2>
        <p className="text-xs text-text-muted mt-1">
          {new Date(order.created_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}{" "}
          · {order.purchase_type === "B2B" ? "Company (B2B)" : "Private (B2C)"} · Status:{" "}
          <span className="font-medium text-text-main">
            {ORDER_STATUS_LABELS[order.status]}
          </span>
        </p>
      </div>

      <section className="bg-bg-base border border-border-base/40 rounded-lg p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-text-main mb-4">Order progress</h3>
        <OrderStatusStepper status={order.status} />
      </section>

      {showBankTransfer && (
        <BankTransferInstructions orderId={order.id} totalAmount={order.total_amount} />
      )}

      {showPaymentRetry && (
        <section className="bg-bg-base border border-border-base/40 rounded-lg p-5 shadow-sm">
          <p className="text-sm text-text-muted mb-3">
            Payment is still pending. You can retry on the mock payment page.
          </p>
          <Link
            to={`/checkout/payment/${order.id}`}
            className="inline-flex px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-accent transition-colors"
          >
            Retry payment
          </Link>
        </section>
      )}

      {isAdmin && adminAdvanceLabel && (
        <section className="bg-primary/5 border border-primary/20 rounded-lg p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-2">
            Admin demo
          </p>
          <button
            type="button"
            onClick={() => advanceStatus.mutate()}
            disabled={advanceStatus.isPending}
            className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-accent transition-colors disabled:opacity-60"
          >
            {advanceStatus.isPending ? "Updating…" : adminAdvanceLabel}
          </button>
        </section>
      )}

      <section className="bg-bg-base border border-border-base/40 rounded-lg p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-text-main mb-3">Items</h3>
        <div className="divide-y divide-border-base/10">
          {order.items.map((item) => (
            <div key={item.id} className="py-3 flex justify-between gap-4">
              <div>
                <p className="text-sm text-text-main">{item.product_name}</p>
                <p className="text-xs text-text-muted">
                  {item.product_sku} · qty {item.quantity}
                  {Number(item.discount_percentage) > 0 && (
                    <> · {Number(item.discount_percentage).toFixed(0)}% off</>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono text-text-main">
                  ${(Number(item.unit_price) * item.quantity).toFixed(2)}
                </p>
                <p className="text-xs text-text-muted font-mono">
                  @${Number(item.unit_price).toFixed(2)} ea
                </p>
              </div>
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
            <span className="text-base font-bold font-mono text-text-main">
              ${Number(order.total_amount).toFixed(2)}
            </span>
          </div>
        </div>
      </section>

      <ShipmentSection shipment={order.shipment} paymentMethod={order.payment_method} />
      <BillingDocumentSection doc={order.billing_document} />

      {order.note && (
        <section className="bg-bg-base border border-border-base/40 rounded-lg p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-text-main mb-2">Note</h3>
          <p className="text-sm text-text-muted whitespace-pre-wrap">{order.note}</p>
        </section>
      )}
    </div>
  );
}
