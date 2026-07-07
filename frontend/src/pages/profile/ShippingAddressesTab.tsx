import { Trash2 } from "lucide-react";
import { useState } from "react";
import AddressForm from "../../components/checkout/AddressForm";
import {
  useCreatePersonalAddress,
  useDeletePersonalAddress,
  usePersonalAddresses,
} from "../../hooks/address/useAddresses";
import type { AddressOut } from "../../api/address";

function AddressCard({
  label,
  street,
  city,
  postal_code,
  country,
  onDelete,
}: {
  label?: string | null;
  street: string;
  city: string;
  postal_code: string;
  country: string;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 p-4 bg-bg-base border border-border-base/40 rounded-lg shadow-sm">
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
      <button
        onClick={onDelete}
        className="text-text-muted hover:text-red-500 transition-colors shrink-0 mt-0.5"
        aria-label="Delete address"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

export default function ShippingAddressesTab() {
  const { data: addresses = [], isLoading } = usePersonalAddresses();
  const createAddress = useCreatePersonalAddress();
  const deleteAddress = useDeletePersonalAddress();
  const [showForm, setShowForm] = useState(false);

  if (isLoading) return <p className="text-sm text-text-muted">Loading…</p>;

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-text-main">
          Shipping Addresses
        </h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-sm text-primary hover:underline"
        >
          {showForm ? "Cancel" : "+ Add shipping address"}
        </button>
      </div>

      {showForm && (
        <div className="bg-bg-base border border-border-base/40 rounded-lg p-4 shadow-sm">
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
          <div className="p-8 bg-bg-base border border-dashed border-border-base/40 rounded-lg text-center text-text-muted text-sm">
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
    </div>
  );
}
