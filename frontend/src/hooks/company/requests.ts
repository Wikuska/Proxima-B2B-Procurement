import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveCompanyRequest,
  getCompanyMembers,
  getCompanySettings,
  getMyAffiliation,
  getMyCompanyRequests,
  getPendingCompanyRequests,
  leaveCompany,
  rejectCompanyRequest,
  removeCompanyMember,
  submitCompanyRequest,
  transferCompanyOwnership,
  updateCompanySettings,
  type CompanySettingsUpdate,
  type SubmitRequestPayload,
} from "../../api/company";
import { useAuthStore } from "../../store/authStore";
import { useCurrentUser } from "../user/useCurrentUser";

export const useMyCompanyRequests = () => {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["company-requests", "me"],
    queryFn: getMyCompanyRequests,
    enabled: !!token,
  });
};

export const useMyAffiliation = () => {
  const { data: user } = useCurrentUser();
  return useQuery({
    queryKey: ["company-affiliation", "me"],
    queryFn: getMyAffiliation,
    enabled: user?.company_id != null,
  });
};

export const usePendingCompanyRequests = () =>
  useQuery({
    queryKey: ["company-requests", "pending"],
    queryFn: getPendingCompanyRequests,
  });

export const useSubmitCompanyRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitRequestPayload) => submitCompanyRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-requests", "me"] });
    },
  });
};

export const useReviewCompanyRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) =>
      approve ? approveCompanyRequest(id) : rejectCompanyRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["company-requests", "pending"],
      });
    },
  });
};

export const useCompanyMembers = () =>
  useQuery({
    queryKey: ["company-members"],
    queryFn: getCompanyMembers,
  });

export const useRemoveCompanyMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => removeCompanyMember(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-members"] });
    },
  });
};

export const useLeaveCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leaveCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["company-requests", "me"] });
      queryClient.invalidateQueries({ queryKey: ["company-affiliation", "me"] });
    },
  });
};

export const useCompanySettings = () =>
  useQuery({
    queryKey: ["company-settings"],
    queryFn: getCompanySettings,
  });

export const useUpdateCompanySettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CompanySettingsUpdate) => updateCompanySettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-settings"] });
      queryClient.invalidateQueries({ queryKey: ["company-affiliation", "me"] });
    },
  });
};

export const useTransferCompanyOwnership = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => transferCompanyOwnership(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["company-members"] });
      queryClient.invalidateQueries({ queryKey: ["company-settings"] });
      queryClient.invalidateQueries({ queryKey: ["company-affiliation", "me"] });
    },
  });
};
