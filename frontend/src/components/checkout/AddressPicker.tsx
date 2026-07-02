import { useState } from "react";
import type { AddressIn, AddressOut } from "../../api/address";
import AddressForm from "./AddressForm";

interface AddressPickerProps {
  variant: "personal" | "company";
  addresses: AddressOut[];
  selectedId: string | null;
  onSelectSaved: (id: string) => void;
  onSelectInline: (data: AddressIn, save: boolean) => void;
}

export default function AddressPicker({
  variant,
  addresses,
  selectedId,
  onSelectSaved,
  onSelectInline,
}: AddressPickerProps) {
  const [showForm, setShowForm] = useState(false);

  function formatAddress(a: AddressOut) {
    return `${a.street}, ${a.city} ${a.postal_code}, ${a.country}`;
  }

  if (variant === "company") {
    if (addresses.length === 0) {
      return (
        <p className="text-sm text-text-muted py-2">
          No company addresses available. Ask a company admin to add one in the
          Company dashboard.
        </p>
      );
    }
    return (
      <div className="space-y-2">
        {addresses.map((a) => (
          <label key={a.id} className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="company-address"
              value={a.id}
              checked={selectedId === a.id}
              onChange={() => onSelectSaved(a.id)}
              className="mt-0.5 accent-primary"
            />
            <span className="text-sm text-text-main">
              {a.label && <span className="font-medium mr-1">{a.label}:</span>}
              {formatAddress(a)}
            </span>
          </label>
        ))}
      </div>
    );
  }

  // Personal variant
  return (
    <div className="space-y-3">
      {addresses.map((a) => (
        <label key={a.id} className="flex items-start gap-3 cursor-pointer">
          <input
            type="radio"
            name="personal-address"
            value={a.id}
            checked={selectedId === a.id && !showForm}
            onChange={() => {
              setShowForm(false);
              onSelectSaved(a.id);
            }}
            className="mt-0.5 accent-primary"
          />
          <span className="text-sm text-text-main">
            {a.label && <span className="font-medium mr-1">{a.label}:</span>}
            {formatAddress(a)}
          </span>
        </label>
      ))}

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="radio"
          name="personal-address"
          checked={showForm}
          onChange={() => {
            setShowForm(true);
            onSelectSaved("");
          }}
          className="accent-primary"
        />
        <span className="text-sm text-text-main font-medium">Add new address</span>
      </label>

      {showForm && (
        <div className="pl-7 pt-2">
          <AddressForm
            showSaveOption
            onSubmit={(data, save) => {
              onSelectInline(data, save);
            }}
          />
        </div>
      )}
    </div>
  );
}
