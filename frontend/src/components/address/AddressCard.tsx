import { Pencil, Trash2 } from "lucide-react";

export interface AddressCardProps {
  label?: string | null;
  street: string;
  city: string;
  postal_code: string;
  country: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function AddressCard({
  label,
  street,
  city,
  postal_code,
  country,
  onEdit,
  onDelete,
}: AddressCardProps) {
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
      {(onEdit || onDelete) && (
        <div className="flex items-center gap-2 shrink-0 mt-0.5">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="text-text-muted hover:text-primary transition-colors"
              aria-label="Edit address"
            >
              <Pencil size={16} />
            </button>
          )}
          {onDelete && (
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
      )}
    </div>
  );
}
