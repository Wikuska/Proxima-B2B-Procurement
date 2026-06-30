import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createCompanyAddress,
  createPersonalAddress,
  deleteCompanyAddress,
  deletePersonalAddress,
  getCompanyAddresses,
  getPersonalAddresses,
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

export function useCompanyAddresses() {
  return useQuery({
    queryKey: ["addresses", "company"],
    queryFn: getCompanyAddresses,
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
