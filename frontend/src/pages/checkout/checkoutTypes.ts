import type { AddressIn, AddressOut } from "../../api/address";
import type {
  BillingDocumentIn,
  DocumentType,
  PurchaseType,
} from "../../api/order";
import type { useCartQuote } from "../../hooks/pricing/useCartQuote";
import type { useCartView } from "../../hooks/cart/useCartView";

export interface BillingFormState {
  documentType: DocumentType;
  firstName: string;
  lastName: string;
  companyName: string;
  companyNip: string;
  billingStreet: string;
  billingCity: string;
  billingPostalCode: string;
  billingCountry: string;
}

export const emptyBilling: BillingFormState = {
  documentType: "RECEIPT",
  firstName: "",
  lastName: "",
  companyName: "",
  companyNip: "",
  billingStreet: "",
  billingCity: "",
  billingPostalCode: "",
  billingCountry: "",
};

export function isBillingComplete(
  f: BillingFormState,
  isCompanyMode: boolean,
): boolean {
  if (isCompanyMode) return true;
  if (f.documentType === "RECEIPT") return true;
  const hasAddr =
    !!f.billingStreet &&
    !!f.billingCity &&
    !!f.billingPostalCode &&
    !!f.billingCountry;
  if (f.documentType === "PERSONAL_INVOICE")
    return !!f.firstName && !!f.lastName && hasAddr;
  if (f.documentType === "COMPANY_INVOICE")
    return !!f.companyName && !!f.companyNip && hasAddr;
  return false;
}

export function buildBillingDocumentIn(
  f: BillingFormState,
  isCompanyMode: boolean,
): BillingDocumentIn {
  if (isCompanyMode) return { document_type: "COMPANY_INVOICE" };
  if (f.documentType === "RECEIPT") return { document_type: "RECEIPT" };
  const base = {
    document_type: f.documentType,
    billing_street: f.billingStreet,
    billing_city: f.billingCity,
    billing_postal_code: f.billingPostalCode,
    billing_country: f.billingCountry,
  };
  if (f.documentType === "PERSONAL_INVOICE") {
    return { ...base, first_name: f.firstName, last_name: f.lastName };
  }
  return { ...base, company_name: f.companyName, company_nip: f.companyNip };
}

export interface CheckoutContext {
  // Cart / pricing
  selectedLines: ReturnType<typeof useCartView>["lines"];
  quote: ReturnType<typeof useCartQuote>["data"];
  grandTotal: number | null;

  // Purchase type
  purchaseType: PurchaseType;
  effectivePurchaseType: PurchaseType;
  isCompanyMode: boolean;
  hasB2B: boolean;
  hasCompany: boolean;
  hasB2bSelected: boolean;
  b2bBlockedNoCompany: boolean;
  changePurchaseType: (type: PurchaseType) => void;

  // Shipping address
  personalAddresses: AddressOut[];
  companyAddresses: AddressOut[];
  companyBillingAddress: AddressOut | null | undefined;
  addressId: string | null;
  setAddressId: (id: string | null) => void;
  inlineAddress: AddressIn | null;
  setInlineAddress: (data: AddressIn | null) => void;
  saveAddress: boolean;
  setSaveAddress: (save: boolean) => void;
  selectedAddress: AddressOut | undefined;

  // Billing document
  billing: BillingFormState;
  setBilling: (b: BillingFormState) => void;

  // Derived guards
  canProceedToDocument: boolean;
  isBillingComplete: boolean;

  // Submission
  handlePlaceOrder: () => void;
  isPlacingOrder: boolean;
}
