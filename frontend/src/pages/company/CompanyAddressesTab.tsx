import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import type { AddressOut } from "../../api/address";
import Panel from "../../components/common/Panel";
import AddressForm from "../../components/forms/AddressForm";
import {
  useCompanyBillingAddress,
  useCompanyShippingAddresses,
  useCreateCompanyAddress,
  useDeleteCompanyAddress,
  useUpdateCompanyAddress,
} from "../../hooks/address/useAddresses";
import { useAuth } from "../../hooks/user/useAuth";

function AddressCard({
  label,
  street,
  city,
  postal_code,
  country,
  onDelete,
  onEdit,
  canDelete,
  canEdit,
}: {
  label?: string | null;
  street: string;
  city: string;
  postal_code: string;
  country: string;
  onDelete?: () => void;
  onEdit?: () => void;
  canDelete?: boolean;
  canEdit?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 p-4 bg-bg-base border border-border-base/40 rounded-xl">
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
      <div className="flex items-center gap-2 shrink-0 mt-0.5">
        {canEdit && onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="text-text-muted hover:text-primary transition-colors"
            aria-label="Edit address"
          >
            <Pencil size={16} />
          </button>
        )}
        {canDelete && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="text-text-muted hover:text-red-500 transition-colors"
            aria-label="Delete address"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function CompanyAddressesTab() {
  const { isCompanyAdmin } = useAuth();
  const { data: shippingAddresses = [], isLoading: loadingShipping } =
    useCompanyShippingAddresses();
  const { data: billingAddress, isLoading: loadingBilling } =
    useCompanyBillingAddress();
  const createAddress = useCreateCompanyAddress();
  const updateAddress = useUpdateCompanyAddress();
  const deleteAddress = useDeleteCompanyAddress();
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [editingBilling, setEditingBilling] = useState(false);

  if (loadingShipping || loadingBilling)
    return <p className="text-sm text-text-muted">Loading…</p>;

  const billingInitialValues = billingAddress
    ? {
        label: billingAddress.label ?? undefined,
        street: billingAddress.street,
        city: billingAddress.city,
        postal_code: billingAddress.postal_code,
        country: billingAddress.country,
      }
    : undefined;

  return (
    <div className="space-y-4 w-full">
      <div>
        <h2 className="text-3xl font-bold text-text-main mb-2 tracking-tight">
          Addresses
        </h2>
        <p className="text-text-muted mb-5">
          Shipping destinations and the company invoice address.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <Panel
          className="lg:col-span-2"
          title="Shipping addresses"
          description="Delivery locations for company orders."
          headerAside={
            isCompanyAdmin ? (
              <button
                type="button"
                onClick={() => setShowShippingForm((v) => !v)}
                className="text-sm text-primary hover:underline shrink-0"
              >
                {showShippingForm ? "Cancel" : "+ Add shipping address"}
              </button>
            ) : undefined
          }
        >
          <div className="space-y-3">
            {showShippingForm && isCompanyAdmin && (
              <div className="p-4 bg-bg-base border border-border-base/40 rounded-xl">
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
              !showShippingForm && (
                // <div className="p-8 border border-dashed border-border-base/40 rounded-xl text-center text-text-muted text-sm">
                <div className="p-6 bg-bg-base border border-border-base/40 rounded-xl text-center text-text-muted text-sm">
                  No shipping addresses yet.
                </div>
              )
            ) : (
              <ul className="space-y-3">
                {shippingAddresses.map((a: AddressOut) => (
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
          </div>
        </Panel>

        <Panel
          className="lg:col-span-1"
          title="Billing address"
          description="HQ used on company invoices. One per company."
          headerAside={
            isCompanyAdmin && billingAddress && !editingBilling ? (
              <button
                type="button"
                onClick={() => setEditingBilling(true)}
                className="text-sm text-primary hover:underline shrink-0"
              >
                Edit
              </button>
            ) : isCompanyAdmin && editingBilling ? (
              <button
                type="button"
                onClick={() => setEditingBilling(false)}
                className="text-sm text-text-muted hover:underline shrink-0"
              >
                Cancel
              </button>
            ) : undefined
          }
        >
          {editingBilling && billingAddress && isCompanyAdmin ? (
            <div className="p-4 bg-bg-base border border-border-base/40 rounded-xl">
              <AddressForm
                showSaveOption={false}
                defaultValues={billingInitialValues}
                onSubmit={(data) => {
                  updateAddress.mutate(
                    {
                      id: billingAddress.id,
                      data: { ...data, address_type: "BILLING" },
                    },
                    { onSuccess: () => setEditingBilling(false) },
                  );
                }}
              />
            </div>
          ) : billingAddress ? (
            <AddressCard
              label={billingAddress.label}
              street={billingAddress.street}
              city={billingAddress.city}
              postal_code={billingAddress.postal_code}
              country={billingAddress.country}
            />
          ) : (
            <div className="p-8 border border-dashed border-border-base/40 rounded-xl text-center text-text-muted text-sm">
              {isCompanyAdmin
                ? "No billing address set. Contact support to configure one."
                : "No billing address configured. Contact your company admin."}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
