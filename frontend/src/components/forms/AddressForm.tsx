import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { AddressIn } from "../../api/address";
import { addressSchema, type AddressFormData } from "../../schemas/addressSchema";
import FormButton from "./FormButton";
import FormInput from "./FormInput";

interface AddressFormProps {
  onSubmit: (data: AddressIn, save: boolean) => void;
  showSaveOption?: boolean;
  defaultValues?: Partial<AddressFormData>;
}

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
  } = useForm<AddressFormData>({ resolver: zodResolver(addressSchema), defaultValues });

  function submit(values: AddressFormData) {
    const { label, ...rest } = values;
    onSubmit({ ...rest, label: label || undefined }, save);
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-3">
      <FormInput
        {...register("street")}
        id="street"
        label="Street address"
        placeholder="Street address"
        hideLabel
        error={errors.street?.message}
      />
      <div className="grid grid-cols-2 gap-3">
        <FormInput
          {...register("city")}
          id="city"
          label="City"
          placeholder="City"
          hideLabel
          error={errors.city?.message}
        />
        <FormInput
          {...register("postal_code")}
          id="postal_code"
          label="Postal code"
          placeholder="Postal code"
          hideLabel
          error={errors.postal_code?.message}
        />
      </div>
      <FormInput
        {...register("country")}
        id="country"
        label="Country"
        placeholder="Country"
        hideLabel
        error={errors.country?.message}
      />
      <FormInput
        {...register("label")}
        id="label"
        label="Label (optional)"
        placeholder="Label (optional, e.g. Home)"
        hideLabel
      />

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

      <FormButton type="submit">Use this address</FormButton>
    </form>
  );
}
