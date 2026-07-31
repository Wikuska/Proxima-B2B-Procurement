import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAdminProduct,
  fetchAdminProduct,
  fetchAdminProducts,
  updateAdminProduct,
  type AdminProductWriteIn,
} from "../../api/adminCatalog";

export function useAdminProducts() {
  return useQuery({
    queryKey: ["admin-products"],
    queryFn: ({ signal }) => fetchAdminProducts(signal),
  });
}

export function useAdminProduct(productId: string | undefined) {
  return useQuery({
    queryKey: ["admin-product", productId],
    queryFn: ({ signal }) => fetchAdminProduct(productId!, signal),
    enabled: !!productId,
  });
}

export function useCreateAdminProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AdminProductWriteIn) => createAdminProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });
}

export function useUpdateAdminProduct(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AdminProductWriteIn) =>
      updateAdminProduct(productId, data),
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.setQueryData(["admin-product", productId], product);
    },
  });
}
