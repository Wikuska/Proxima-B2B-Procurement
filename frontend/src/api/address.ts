import apiFetch from "./client";

export type AddressType = "SHIPPING" | "BILLING";

export interface AddressOut {
  id: string;
  address_type: AddressType;
  label: string | null;
  street: string;
  city: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

export interface AddressIn {
  address_type?: AddressType;
  label?: string;
  street: string;
  city: string;
  postal_code: string;
  country: string;
}

// Personal addresses
export const getPersonalAddresses = (): Promise<AddressOut[]> =>
  apiFetch<AddressOut[]>("/addresses");

export const createPersonalAddress = (data: AddressIn): Promise<AddressOut> =>
  apiFetch<AddressOut>("/addresses", { method: "POST", body: data });

export const deletePersonalAddress = (id: string): Promise<void> =>
  apiFetch<void>(`/addresses/${id}`, { method: "DELETE" });

// Company addresses
export const getCompanyShippingAddresses = (): Promise<AddressOut[]> =>
  apiFetch<AddressOut[]>("/companies/addresses/shipping");

export const getCompanyBillingAddress = (): Promise<AddressOut | null> =>
  apiFetch<AddressOut | null>("/companies/addresses/billing");

export const createCompanyAddress = (data: AddressIn): Promise<AddressOut> =>
  apiFetch<AddressOut>("/companies/addresses", { method: "POST", body: data });

export const deleteCompanyAddress = (id: string): Promise<void> =>
  apiFetch<void>(`/companies/addresses/${id}`, { method: "DELETE" });
