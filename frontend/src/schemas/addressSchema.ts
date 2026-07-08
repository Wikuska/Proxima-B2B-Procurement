import { z } from "zod";

const postalCodeRegex = /^[A-Za-z0-9\s-]{2,12}$/;

export const addressSchema = z.object({
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  postal_code: z
    .string()
    .min(1, "Postal code is required")
    .regex(postalCodeRegex, "Enter a valid postal code"),
  country: z.string().min(1, "Country is required"),
  label: z.string().optional(),
});

export type AddressFormData = z.infer<typeof addressSchema>;
