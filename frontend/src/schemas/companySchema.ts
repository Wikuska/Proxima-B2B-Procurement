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
