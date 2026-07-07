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

const INLINE_ID = "__inline__";

export default function AddressPicker({
  variant,
  addresses,
  selectedId,
  onSelectSaved,
  onSelectInline,
}: AddressPickerProps) {
  const [showForm, setShowForm] = useState(false);
  const [submittedInline, setSubmittedInline] = useState<{
    data: AddressIn;
    save: boolean;
  } | null>(null);
  const [selection, setSelection] = useState<string | typeof INLINE_ID | "">(
    "",
  );

  function formatAddress(a: AddressOut | AddressIn) {
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
  function selectSaved(id: string) {
    setShowForm(false);
    setSelection(id);
    onSelectSaved(id);
  }

  function selectInline() {
    setShowForm(false);
    setSelection(INLINE_ID);
    if (submittedInline) {
      onSelectInline(submittedInline.data, submittedInline.save);
    }
  }

  function openAddForm() {
    setShowForm(true);
    setSelection("");
    onSelectSaved("");
  }

  function openEditForm() {
    setShowForm(true);
  }

  return (
    <div className="space-y-3">
      {addresses.map((a) => (
        <label key={a.id} className="flex items-start gap-3 cursor-pointer">
          <input
            type="radio"
            name="personal-address"
            value={a.id}
            checked={selectedId === a.id && !showForm && selection !== INLINE_ID}
            onChange={() => selectSaved(a.id)}
            className="mt-0.5 accent-primary"
          />
          <span className="text-sm text-text-main">
            {a.label && <span className="font-medium mr-1">{a.label}:</span>}
            {formatAddress(a)}
          </span>
        </label>
      ))}

      {/* Just-entered inline address, shown as a selected row once submitted */}
      {submittedInline && !showForm && (
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="radio"
            name="personal-address"
            checked={selection === INLINE_ID}
            onChange={selectInline}
            className="mt-0.5 accent-primary"
          />
          <span className="text-sm text-text-main flex-1">
            {submittedInline.data.label && (
              <span className="font-medium mr-1">
                {submittedInline.data.label}:
              </span>
            )}
            {formatAddress(submittedInline.data)}
            {submittedInline.save && (
              <span className="block text-xs text-text-muted mt-0.5">
                Will be saved for future orders
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openEditForm();
            }}
            className="text-xs font-medium text-primary hover:text-accent shrink-0"
          >
            Edit
          </button>
        </label>
      )}

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="radio"
          name="personal-address"
          checked={showForm}
          onChange={openAddForm}
          className="accent-primary"
        />
        <span className="text-sm text-text-main font-medium">
          {submittedInline ? "Add another address" : "Add new address"}
        </span>
      </label>

      {showForm && (
        <div className="pl-7 pt-2">
          <AddressForm
            showSaveOption
            defaultValues={
              submittedInline
                ? {
                    street: submittedInline.data.street,
                    city: submittedInline.data.city,
                    postal_code: submittedInline.data.postal_code,
                    country: submittedInline.data.country,
                    label: submittedInline.data.label,
                  }
                : undefined
            }
            onSubmit={(data, save) => {
              setSubmittedInline({ data, save });
              setShowForm(false);
              setSelection(INLINE_ID);
              onSelectInline(data, save);
            }}
          />
        </div>
      )}
    </div>
  );
}
