import apiFetch from "./client";

export interface AddressOut {
  id: string;
  label: string | null;
  street: string;
  city: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

export interface AddressIn {
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
export const getCompanyAddresses = (): Promise<AddressOut[]> =>
  apiFetch<AddressOut[]>("/companies/addresses");

export const createCompanyAddress = (data: AddressIn): Promise<AddressOut> =>
  apiFetch<AddressOut>("/companies/addresses", { method: "POST", body: data });

export const deleteCompanyAddress = (id: string): Promise<void> =>
  apiFetch<void>(`/companies/addresses/${id}`, { method: "DELETE" });
