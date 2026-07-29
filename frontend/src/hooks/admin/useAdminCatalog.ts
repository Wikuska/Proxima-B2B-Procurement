import { useQuery } from "@tanstack/react-query";
import { fetchAdminProduct, fetchAdminProducts } from "../../api/adminCatalog";

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
