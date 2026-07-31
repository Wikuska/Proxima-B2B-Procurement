import { z } from "zod";

const volumeDiscountSchema = z.object({
  min_quantity: z
    .string()
    .trim()
    .min(1, "Required")
    .refine((v) => /^\d+$/.test(v) && Number(v) >= 1, "Min. 1"),
  discount_percentage: z
    .string()
    .trim()
    .min(1, "Required")
    .refine(
      (v) => /^\d+(\.\d{1,2})?$/.test(v) && Number(v) > 0 && Number(v) <= 100,
      "1–100%",
    ),
});

export const adminProductSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(255),
    sku: z.string().trim().min(1, "SKU is required").max(100),
    category_id: z.string().uuid("Select a category"),
    description: z.string().max(5000).optional().or(z.literal("")),
    base_price: z
      .string()
      .trim()
      .min(1, "Price is required")
      .refine(
        (v) => /^\d+(\.\d{1,2})?$/.test(v) && Number(v) > 0,
        "Enter a valid price greater than 0",
      ),
    stock_quantity: z
      .string()
      .trim()
      .min(1, "Stock is required")
      .refine((v) => /^\d+$/.test(v), "Stock must be a whole number"),
    main_image_url: z.string().max(2048).optional().or(z.literal("")),
    is_active: z.boolean(),
    is_b2b_only: z.boolean(),
    volume_discounts: z.array(volumeDiscountSchema),
  })
  .superRefine((data, ctx) => {
    const seen = new Set<string>();
    data.volume_discounts.forEach((tier, index) => {
      const key = tier.min_quantity.trim();
      if (!key || seen.has(key)) {
        if (key && seen.has(key)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Duplicate quantity",
            path: ["volume_discounts", index, "min_quantity"],
          });
        }
        return;
      }
      seen.add(key);
    });
  });

export type AdminProductFormData = z.infer<typeof adminProductSchema>;

export const emptyAdminProductDefaults: AdminProductFormData = {
  name: "",
  sku: "",
  category_id: "",
  description: "",
  base_price: "",
  stock_quantity: "0",
  main_image_url: "",
  is_active: true,
  is_b2b_only: false,
  volume_discounts: [],
};
