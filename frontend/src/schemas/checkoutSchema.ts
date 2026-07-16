import { z } from "zod";
import type { BillingDocumentIn, DocumentType } from "../api/order";

const phoneRegex = /^[+]?[\d\s-]{7,}$/;
const postalCodeRegex = /^[A-Za-z0-9\s-]{2,12}$/;

export const recipientSchema = z.object({
  recipient_name: z
    .string()
    .min(2, "Must be at least 2 characters")
    .max(200, "Must be at most 200 characters"),
  recipient_phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(phoneRegex, "Enter a valid phone number"),
  recipient_email: z.email("Invalid email address").or(z.literal("")),
});

const billingAddressFields = {
  billingStreet: z.string().min(1, "Street is required"),
  billingCity: z.string().min(1, "City is required"),
  billingPostalCode: z
    .string()
    .min(1, "Postal code is required")
    .regex(postalCodeRegex, "Enter a valid postal code"),
  billingCountry: z.string().min(1, "Country is required"),
};

const receiptSchema = z.object({
  documentType: z.literal("RECEIPT"),
});

const personalInvoiceSchema = z.object({
  documentType: z.literal("PERSONAL_INVOICE"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  ...billingAddressFields,
});

const companyInvoiceSchema = z.object({
  documentType: z.literal("COMPANY_INVOICE"),
  companyName: z.string().min(1, "Company name is required"),
  companyNip: z.string().min(1, "NIP is required"),
  ...billingAddressFields,
});

export const billingSchema = z.discriminatedUnion("documentType", [
  receiptSchema,
  personalInvoiceSchema,
  companyInvoiceSchema,
]);

export const detailsSchema = z.object({
  recipient: recipientSchema,
  billing: billingSchema,
});

export type DetailsFormData = z.infer<typeof detailsSchema>;
export type BillingFormValues = z.infer<typeof billingSchema>;

/** Default (empty) billing values — a superset of every document-type branch,
 * so switching the radio doesn't drop previously typed values. */
export const emptyBillingValues = {
  documentType: "RECEIPT" as DocumentType,
  firstName: "",
  lastName: "",
  companyName: "",
  companyNip: "",
  billingStreet: "",
  billingCity: "",
  billingPostalCode: "",
  billingCountry: "",
};

export function buildBillingDocumentIn(
  billing: DetailsFormData["billing"],
  useProfileBilling: boolean,
): BillingDocumentIn {
  if (useProfileBilling) return { document_type: "COMPANY_INVOICE" };
  if (billing.documentType === "RECEIPT") return { document_type: "RECEIPT" };

  const base = {
    document_type: billing.documentType,
    billing_street: billing.billingStreet,
    billing_city: billing.billingCity,
    billing_postal_code: billing.billingPostalCode,
    billing_country: billing.billingCountry,
  };
  if (billing.documentType === "PERSONAL_INVOICE") {
    return { ...base, first_name: billing.firstName, last_name: billing.lastName };
  }
  return { ...base, company_name: billing.companyName, company_nip: billing.companyNip };
}
