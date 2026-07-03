import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import type { BillingDocumentOut } from "../../api/order";
import { useOrder } from "../../hooks/order/useOrders";

const DOC_TYPE_LABEL: Record<string, string> = {
  RECEIPT: "Receipt",
  PERSONAL_INVOICE: "Personal Invoice",
  COMPANY_INVOICE: "Company Invoice",
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

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { data: order, isLoading, isError } = useOrder(orderId ?? "");

  if (isLoading) return <p className="text-sm text-text-muted">Loading…</p>;
  if (isError || !order) return <p className="text-sm text-red-500">Order not found.</p>;

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
            {order.status.replace(/_/g, " ")}
          </span>
        </p>
      </div>

      {/* Items */}
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
        <div className="border-t border-border-base/10 mt-3 pt-3 flex justify-between">
          <span className="text-sm font-bold text-text-main">Total</span>
          <span className="text-base font-bold font-mono text-text-main">
            ${Number(order.total_amount).toFixed(2)}
          </span>
        </div>
      </section>

      {/* Delivery */}
      <section className="bg-bg-base border border-border-base/40 rounded-lg p-5 shadow-sm space-y-2">
        <h3 className="text-sm font-semibold text-text-main mb-3">Delivery</h3>
        <p className="text-sm text-text-muted">
          {order.shipping_street}, {order.shipping_city}{" "}
          {order.shipping_postal_code}, {order.shipping_country}
        </p>
      </section>

      {/* Billing document */}
      <BillingDocumentSection doc={order.billing_document} />
    </div>
  );
}
