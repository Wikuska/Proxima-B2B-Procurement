import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveCompanyRequest,
  getMyCompanyRequests,
  getPendingCompanyRequests,
  rejectCompanyRequest,
  submitCompanyRequest,
  type SubmitRequestPayload,
} from "../../api/company";
import { useAuthStore } from "../../store/authStore";

export const useMyCompanyRequests = () => {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["company-requests", "me"],
    queryFn: getMyCompanyRequests,
    enabled: !!token,
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
