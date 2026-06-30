import { Trash2 } from "lucide-react";
import { useState } from "react";
import {
  useCompanyAddresses,
  useCreateCompanyAddress,
  useDeleteCompanyAddress,
} from "../../hooks/address/useAddresses";
import AddressForm from "../../components/checkout/AddressForm";
import { useAuth } from "../../hooks/user/useAuth";

export default function CompanyAddressesTab() {
  const { isCompanyAdmin } = useAuth();
  const { data: addresses = [], isLoading } = useCompanyAddresses();
  const createAddress = useCreateCompanyAddress();
  const deleteAddress = useDeleteCompanyAddress();
  const [showForm, setShowForm] = useState(false);

  if (isLoading) return <p className="text-sm text-text-muted">Loading…</p>;

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-text-main">Company Shipping Addresses</h2>
        {isCompanyAdmin && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="text-sm text-primary hover:underline"
          >
            {showForm ? "Cancel" : "+ Add address"}
          </button>
        )}
      </div>

      {showForm && isCompanyAdmin && (
        <div className="bg-bg-surface border border-border-base/20 rounded-xl p-4 shadow-sm">
          <AddressForm
            showSaveOption={false}
            onSubmit={(data) => {
              createAddress.mutate(data, { onSuccess: () => setShowForm(false) });
            }}
          />
        </div>
      )}

      {addresses.length === 0 ? (
        <div className="p-8 bg-bg-surface border border-dashed border-border-base/40 rounded-xl text-center text-text-muted text-sm">
          No addresses yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {addresses.map((a) => (
            <li
              key={a.id}
              className="flex items-start justify-between gap-4 p-4 bg-bg-surface border border-border-base/20 rounded-xl shadow-sm"
            >
              <div>
                {a.label && (
                  <p className="text-xs font-semibold text-text-muted mb-0.5 uppercase tracking-wide">
                    {a.label}
                  </p>
                )}
                <p className="text-sm text-text-main">
                  {a.street}, {a.city} {a.postal_code}, {a.country}
                </p>
              </div>
              {isCompanyAdmin && (
                <button
                  onClick={() => deleteAddress.mutate(a.id)}
                  disabled={deleteAddress.isPending}
                  className="text-text-muted hover:text-red-500 transition-colors shrink-0 mt-0.5"
                  aria-label="Delete address"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
