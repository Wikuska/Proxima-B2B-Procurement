import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createCompanyAddress,
  createPersonalAddress,
  deleteCompanyAddress,
  deletePersonalAddress,
  getCompanyBillingAddress,
  getCompanyShippingAddresses,
  getPersonalAddresses,
  updateCompanyAddress,
} from "../../api/address";
import type { AddressIn } from "../../api/address";

export function usePersonalAddresses() {
  return useQuery({
    queryKey: ["addresses", "personal"],
    queryFn: getPersonalAddresses,
  });
}

export function useCreatePersonalAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AddressIn) => createPersonalAddress(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addresses", "personal"] });
      toast.success("Address saved");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeletePersonalAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePersonalAddress(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addresses", "personal"] });
      toast.success("Address deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCompanyShippingAddresses() {
  return useQuery({
    queryKey: ["addresses", "company", "shipping"],
    queryFn: getCompanyShippingAddresses,
  });
}

export function useCompanyBillingAddress() {
  return useQuery({
    queryKey: ["addresses", "company", "billing"],
    queryFn: getCompanyBillingAddress,
  });
}

export function useCreateCompanyAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AddressIn) => createCompanyAddress(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addresses", "company"] });
      toast.success("Address saved");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateCompanyAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AddressIn }) =>
      updateCompanyAddress(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addresses", "company"] });
      toast.success("Address updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteCompanyAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCompanyAddress(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addresses", "company"] });
      toast.success("Address deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
