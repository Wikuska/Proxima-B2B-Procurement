import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { AddressIn } from "../../api/address";

const schema = z.object({
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  postal_code: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
  label: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface AddressFormProps {
  onSubmit: (data: AddressIn, save: boolean) => void;
  showSaveOption?: boolean;
  defaultValues?: Partial<FormValues>;
}

const inputClass =
  "w-full px-3 py-2 text-sm border border-border-base rounded-lg focus:outline-none focus:border-primary bg-bg-surface text-text-main";
const errorClass = "text-xs text-red-500 mt-1";

export default function AddressForm({
  onSubmit,
  showSaveOption = true,
  defaultValues,
}: AddressFormProps) {
  const [save, setSave] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues });

  function submit(values: FormValues) {
    const { label, ...rest } = values;
    onSubmit({ ...rest, label: label || undefined }, save);
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-3">
      <div>
        <input {...register("street")} placeholder="Street address" className={inputClass} />
        {errors.street && <p className={errorClass}>{errors.street.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <input {...register("city")} placeholder="City" className={inputClass} />
          {errors.city && <p className={errorClass}>{errors.city.message}</p>}
        </div>
        <div>
          <input {...register("postal_code")} placeholder="Postal code" className={inputClass} />
          {errors.postal_code && <p className={errorClass}>{errors.postal_code.message}</p>}
        </div>
      </div>
      <div>
        <input {...register("country")} placeholder="Country" className={inputClass} />
        {errors.country && <p className={errorClass}>{errors.country.message}</p>}
      </div>
      <div>
        <input {...register("label")} placeholder="Label (optional, e.g. Home)" className={inputClass} />
      </div>

      {showSaveOption && (
        <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
          <input
            type="checkbox"
            checked={save}
            onChange={(e) => setSave(e.target.checked)}
            className="w-4 h-4 accent-primary"
          />
          Save this address for future orders
        </label>
      )}

      <button
        type="submit"
        className="w-full py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-accent transition-colors"
      >
        Use this address
      </button>
    </form>
  );
}
