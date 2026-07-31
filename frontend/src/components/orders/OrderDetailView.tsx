import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import {
  DELIVERY_LABELS,
  ORDER_STATUS_LABELS,
  PAYMENT_LABELS,
  type BillingDocumentOut,
  type ShipmentOut,
} from "../../api/order";
import BankTransferInstructions from "../checkout/BankTransferInstructions";
import Panel from "../common/Panel";
import {
  formatOrderDate,
  type OrderDetailData,
  type OrderPlacerInfo,
} from "./types";

const DOC_TYPE_LABEL: Record<string, string> = {
  RECEIPT: "Receipt",
  PERSONAL_INVOICE: "Personal Invoice",
  COMPANY_INVOICE: "Company Invoice",
};

function BillingDocumentSection({ doc }: { doc: BillingDocumentOut }) {
  return (
    <Panel title="Billing Document">
      <div className="space-y-2">
        <p className="text-sm text-text-muted">
          <span className="font-medium text-text-main">Type:</span>{" "}
          {DOC_TYPE_LABEL[doc.document_type] ?? doc.document_type}
        </p>
        {doc.company_name && (
          <p className="text-sm text-text-muted">
            <span className="font-medium text-text-main">Company:</span> {doc.company_name}
          </p>
        )}
        {doc.company_nip && (
          <p className="text-sm text-text-muted font-mono">
            <span className="font-medium text-text-main not-font-mono">NIP:</span>{" "}
            {doc.company_nip}
          </p>
        )}
        {doc.first_name && doc.last_name && (
          <p className="text-sm text-text-muted">
            <span className="font-medium text-text-main">Name:</span> {doc.first_name}{" "}
            {doc.last_name}
          </p>
        )}
        {doc.billing_street && (
          <p className="text-sm text-text-muted">
            <span className="font-medium text-text-main">Billing address:</span>{" "}
            {doc.billing_street}, {doc.billing_city} {doc.billing_postal_code},{" "}
            {doc.billing_country}
          </p>
        )}
        {doc.document_number && (
          <p className="text-sm text-text-muted font-mono">
            <span className="font-medium text-text-main not-font-mono">Invoice #:</span>{" "}
            {doc.document_number}
          </p>
        )}
      </div>
    </Panel>
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
    <Panel title="Delivery">
      <div className="space-y-2">
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
      </div>
    </Panel>
  );
}

export interface OrderDetailViewProps {
  order: OrderDetailData;
  backTo: { href: string; label: string };
  placedBy?: OrderPlacerInfo;
  companyName?: string | null;
  showOwnerPaymentActions?: boolean;
  /** Profile stays narrow; company dashboard uses full content width. */
  layout?: "narrow" | "wide";
  /** Optional fulfillment / admin actions under the header. */
  actions?: ReactNode;
}

export default function OrderDetailView({
  order,
  backTo,
  placedBy,
  companyName,
  showOwnerPaymentActions = false,
  layout = "narrow",
  actions,
}: OrderDetailViewProps) {
  const showBankTransfer =
    showOwnerPaymentActions &&
    order.status === "PENDING_PAYMENT" &&
    order.payment_method === "BANK_TRANSFER";
  const showPaymentRetry =
    showOwnerPaymentActions &&
    order.status === "PENDING_PAYMENT" &&
    (order.payment_method === "CARD" || order.payment_method === "BLIK");

  const isWide = layout === "wide";

  const itemsSection = (
    <Panel title="Items">
      <div className="divide-y divide-border-base/10">
        {order.items.map((item) => {
          const lineTotal = Number(item.unit_price) * item.quantity;
          const unit = Number(item.unit_price);
          const nameNode = item.product_slug ? (
            <Link
              to={`/product/${item.product_slug}`}
              className="text-sm font-medium text-primary underline underline-offset-2 hover:text-accent"
            >
              {item.product_name}
            </Link>
          ) : (
            <p className="text-sm font-medium text-text-main">{item.product_name}</p>
          );

          return (
            <div key={item.id} className="py-3 flex justify-between gap-4">
              <div className="min-w-0">
                {nameNode}
                <p className="text-xs text-text-muted mt-0.5">
                  {item.product_sku} · qty {item.quantity}
                  {Number(item.discount_percentage) > 0 && (
                    <> · {Number(item.discount_percentage).toFixed(0)}% off</>
                  )}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-mono text-text-main">
                  ${lineTotal.toFixed(2)}
                </p>
                {item.quantity > 1 && (
                  <p className="text-xs text-text-muted font-mono">
                    {item.quantity} × ${unit.toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
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
    </Panel>
  );

  return (
    <div className={`space-y-6 ${isWide ? "w-full" : "max-w-2xl"}`}>
      <Link
        to={backTo.href}
        className="flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors"
      >
        <ArrowLeft size={14} />
        {backTo.label}
      </Link>

      <div>
        <h2 className="text-lg font-bold text-text-main">
          Order #{order.id.slice(0, 8).toUpperCase()}
        </h2>
        <p className="text-xs text-text-muted mt-1">
          {formatOrderDate(order.created_at, "long")} ·{" "}
          {order.purchase_type === "B2B" ? "Company (B2B)" : "Private (B2C)"} · Status:{" "}
          <span className="font-medium text-text-main">
            {ORDER_STATUS_LABELS[order.status]}
          </span>
        </p>
        {placedBy && (
          <p className="text-xs text-text-muted mt-1">
            Placed by{" "}
            <span className="font-medium text-text-main">{placedBy.name}</span>
            {" · "}
            {placedBy.email}
          </p>
        )}
        {companyName && (
          <p className="text-xs text-text-muted mt-1">
            Company{" "}
            <span className="font-medium text-text-main">{companyName}</span>
          </p>
        )}
      </div>

      {actions && <div>{actions}</div>}

      {showBankTransfer && (
        <BankTransferInstructions orderId={order.id} totalAmount={order.total_amount} />
      )}

      {showPaymentRetry && (
        <Panel title="Payment">
          <p className="text-sm text-text-muted mb-3">
            Payment is still pending. You can retry on the mock payment page.
          </p>
          <Link
            to={`/checkout/payment/${order.id}`}
            className="inline-flex px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-accent transition-colors"
          >
            Retry payment
          </Link>
        </Panel>
      )}

      {isWide ? (
        <>
          {itemsSection}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ShipmentSection
              shipment={order.shipment}
              paymentMethod={order.payment_method}
            />
            <BillingDocumentSection doc={order.billing_document} />
          </div>
        </>
      ) : (
        <>
          {itemsSection}
          <ShipmentSection
            shipment={order.shipment}
            paymentMethod={order.payment_method}
          />
          <BillingDocumentSection doc={order.billing_document} />
        </>
      )}

      {order.note && (
        <Panel title="Note">
          <p className="text-sm text-text-muted whitespace-pre-wrap">{order.note}</p>
        </Panel>
      )}
    </div>
  );
}
