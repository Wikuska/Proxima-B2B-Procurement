import { z } from "zod";

export const joinCompanySchema = z.object({
  requested_nip: z
    .string()
    .min(1, "NIP is required")
    .refine(
      (v) => /^\d{10}$/.test(v.replace(/[\s-]/g, "")),
      "NIP must be exactly 10 digits",
    ),
});

export type JoinCompanyFormData = z.infer<typeof joinCompanySchema>;

export const companySettingsSchema = z.object({
  name: z.string().trim().min(1, "Company name is required").max(255),
  phone: z.string().max(50),
});

export type CompanySettingsFormData = z.infer<typeof companySettingsSchema>;
