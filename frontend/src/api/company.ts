import apiFetch from "./client";
import type {
  BillingDocumentOut,
  OrderItemOut,
  OrderStatus,
  PaymentMethod,
  PurchaseType,
  ShipmentOut,
} from "./order";

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
  company_joined_at: string | null;
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

export const leaveCompany = () =>
  apiFetch<{ message: string }>("/companies/me/affiliation", {
    method: "DELETE",
  });

export interface CompanyAffiliation {
  company_name: string;
  company_nip: string;
  discount_percentage: string;
  role: "CUSTOMER" | "COMPANY_ADMIN" | "ADMIN";
  joined_at: string | null;
}

export const getMyAffiliation = () =>
  apiFetch<CompanyAffiliation>("/companies/me");

export interface CompanyOrderPlacer {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface CompanyOrderSummary {
  id: string;
  status: OrderStatus;
  purchase_type: PurchaseType;
  company_id: string | null;
  total_amount: string;
  created_at: string;
  item_count: number;
  placed_by: CompanyOrderPlacer;
}

export interface CompanyOrderDetail {
  id: string;
  status: OrderStatus;
  purchase_type: PurchaseType;
  company_id: string | null;
  payment_method: PaymentMethod;
  total_amount: string;
  note: string | null;
  created_at: string;
  billing_document: BillingDocumentOut;
  shipment: ShipmentOut;
  items: OrderItemOut[];
  placed_by: CompanyOrderPlacer;
}

export const getCompanyOrders = (status?: OrderStatus) => {
  const qs = status ? `?status=${status}` : "";
  return apiFetch<CompanyOrderSummary[]>(`/companies/orders${qs}`);
};

export const getCompanyOrder = (orderId: string) =>
  apiFetch<CompanyOrderDetail>(`/companies/orders/${orderId}`);
