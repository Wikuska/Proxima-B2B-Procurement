import { Trash2 } from "lucide-react";
import { useState } from "react";
import {
  useCompanyBillingAddress,
  useCompanyShippingAddresses,
  useCreateCompanyAddress,
  useDeleteCompanyAddress,
} from "../../hooks/address/useAddresses";
import AddressForm from "../../components/checkout/AddressForm";
import { useAuth } from "../../hooks/user/useAuth";

const _BILLING_PAYLOAD_DEFAULTS = {
  address_type: "BILLING" as const,
};

function AddressCard({
  label,
  street,
  city,
  postal_code,
  country,
  onDelete,
  canDelete,
}: {
  label?: string | null;
  street: string;
  city: string;
  postal_code: string;
  country: string;
  onDelete?: () => void;
  canDelete?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 p-4 bg-bg-surface border border-border-base/20 rounded-xl shadow-sm">
      <div>
        {label && (
          <p className="text-xs font-semibold text-text-muted mb-0.5 uppercase tracking-wide">
            {label}
          </p>
        )}
        <p className="text-sm text-text-main">
          {street}, {city} {postal_code}, {country}
        </p>
      </div>
      {canDelete && onDelete && (
        <button
          onClick={onDelete}
          className="text-text-muted hover:text-red-500 transition-colors shrink-0 mt-0.5"
          aria-label="Delete address"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}

export default function CompanyAddressesTab() {
  const { isCompanyAdmin } = useAuth();
  const { data: shippingAddresses = [], isLoading: loadingShipping } =
    useCompanyShippingAddresses();
  const { data: billingAddress, isLoading: loadingBilling } = useCompanyBillingAddress();
  const createAddress = useCreateCompanyAddress();
  const deleteAddress = useDeleteCompanyAddress();
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [showBillingForm, setShowBillingForm] = useState(false);

  if (loadingShipping || loadingBilling)
    return <p className="text-sm text-text-muted">Loading…</p>;

  return (
    <div className="max-w-lg space-y-10">
      {/* ── SHIPPING addresses ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-text-main">Shipping Addresses</h2>
          {isCompanyAdmin && (
            <button
              onClick={() => setShowShippingForm((v) => !v)}
              className="text-sm text-primary hover:underline"
            >
              {showShippingForm ? "Cancel" : "+ Add shipping address"}
            </button>
          )}
        </div>

        {showShippingForm && isCompanyAdmin && (
          <div className="bg-bg-surface border border-border-base/20 rounded-xl p-4 shadow-sm">
            <AddressForm
              showSaveOption={false}
              onSubmit={(data) => {
                createAddress.mutate(
                  { ...data, address_type: "SHIPPING" },
                  { onSuccess: () => setShowShippingForm(false) },
                );
              }}
            />
          </div>
        )}

        {shippingAddresses.length === 0 ? (
          <div className="p-8 bg-bg-surface border border-dashed border-border-base/40 rounded-xl text-center text-text-muted text-sm">
            No shipping addresses yet.
          </div>
        ) : (
          <ul className="space-y-3">
            {shippingAddresses.map((a) => (
              <li key={a.id}>
                <AddressCard
                  label={a.label}
                  street={a.street}
                  city={a.city}
                  postal_code={a.postal_code}
                  country={a.country}
                  canDelete={isCompanyAdmin}
                  onDelete={() => deleteAddress.mutate(a.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── BILLING address ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-text-main">Billing Address (HQ)</h2>
          {isCompanyAdmin && !billingAddress && (
            <button
              onClick={() => setShowBillingForm((v) => !v)}
              className="text-sm text-primary hover:underline"
            >
              {showBillingForm ? "Cancel" : "+ Set billing address"}
            </button>
          )}
        </div>

        <p className="text-xs text-text-muted">
          Used for company invoices. One billing address per company.
        </p>

        {showBillingForm && isCompanyAdmin && !billingAddress && (
          <div className="bg-bg-surface border border-border-base/20 rounded-xl p-4 shadow-sm">
            <AddressForm
              showSaveOption={false}
              onSubmit={(data) => {
                createAddress.mutate(
                  { ...data, ..._BILLING_PAYLOAD_DEFAULTS },
                  { onSuccess: () => setShowBillingForm(false) },
                );
              }}
            />
          </div>
        )}

        {billingAddress ? (
          <AddressCard
            label={billingAddress.label}
            street={billingAddress.street}
            city={billingAddress.city}
            postal_code={billingAddress.postal_code}
            country={billingAddress.country}
            canDelete={isCompanyAdmin}
            onDelete={() => deleteAddress.mutate(billingAddress.id)}
          />
        ) : (
          <div className="p-8 bg-bg-surface border border-dashed border-border-base/40 rounded-xl text-center text-text-muted text-sm">
            {isCompanyAdmin
              ? "No billing address set. Add one to enable company invoices."
              : "No billing address configured. Contact your company admin."}
          </div>
        )}
      </section>
    </div>
  );
}
