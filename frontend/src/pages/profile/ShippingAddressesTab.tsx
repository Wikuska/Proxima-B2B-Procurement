import { useState } from "react";
import type { AddressOut } from "../../api/address";
import AddressCard from "../../components/address/AddressCard";
import Panel from "../../components/common/Panel";
import AddressForm from "../../components/forms/AddressForm";
import {
  useCreatePersonalAddress,
  useDeletePersonalAddress,
  usePersonalAddresses,
} from "../../hooks/address/useAddresses";

export default function ShippingAddressesTab() {
  const { data: addresses = [], isLoading } = usePersonalAddresses();
  const createAddress = useCreatePersonalAddress();
  const deleteAddress = useDeletePersonalAddress();
  const [showForm, setShowForm] = useState(false);

  if (isLoading) return <p className="text-sm text-text-muted">Loading…</p>;

  return (
    <div className="w-full space-y-4">
      <Panel
        title="Shipping Addresses"
        headerAside={
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="text-sm text-primary hover:underline shrink-0"
          >
            {showForm ? "Cancel" : "+ Add shipping address"}
          </button>
        }
      >
        {showForm && (
          <div className="mb-4 p-4 bg-bg-base border border-border-base/40 rounded-xl">
            <AddressForm
              showSaveOption={false}
              onSubmit={(data) => {
                createAddress.mutate(
                  { ...data, address_type: "SHIPPING" },
                  { onSuccess: () => setShowForm(false) },
                );
              }}
            />
          </div>
        )}

        {addresses.length === 0 ? (
          !showForm && (
            <div className="p-8 bg-bg-base border border-dashed border-border-base/40 rounded-xl text-center text-text-muted text-sm">
              No shipping addresses yet.
            </div>
          )
        ) : (
          <ul className="space-y-3">
            {addresses.map((a: AddressOut) => (
              <li key={a.id}>
                <AddressCard
                  label={a.label}
                  street={a.street}
                  city={a.city}
                  postal_code={a.postal_code}
                  country={a.country}
                  onDelete={() => deleteAddress.mutate(a.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
