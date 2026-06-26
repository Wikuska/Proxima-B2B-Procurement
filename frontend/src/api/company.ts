import apiFetch from "./client";

export interface CompanyRequest {
  id: string;
  requested_nip: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  created_at: string;
  reviewed_at: string | null;
}

export interface CompanyRequestAdmin extends CompanyRequest {
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
}

export interface SubmitRequestPayload {
  requested_nip: string;
}

export interface CompanyMember {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "CUSTOMER" | "COMPANY_ADMIN" | "ADMIN";
}

export const submitCompanyRequest = (payload: SubmitRequestPayload) =>
  apiFetch<CompanyRequest>("/companies/requests", {
    method: "POST",
    body: payload,
  });

export const getMyCompanyRequests = () =>
  apiFetch<CompanyRequest[]>("/companies/requests/me");

export const getPendingCompanyRequests = () =>
  apiFetch<CompanyRequestAdmin[]>("/companies/requests/pending");

export const approveCompanyRequest = (id: string) =>
  apiFetch<CompanyRequest>(`/companies/requests/${id}/approve`, {
    method: "POST",
  });

export const rejectCompanyRequest = (id: string) =>
  apiFetch<CompanyRequest>(`/companies/requests/${id}/reject`, {
    method: "POST",
  });

export const getCompanyMembers = () =>
  apiFetch<CompanyMember[]>("/companies/members");

export const removeCompanyMember = (userId: string) =>
  apiFetch<{ message: string }>(`/companies/members/${userId}`, {
    method: "DELETE",
  });
