import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { createOrder, getOrder, getOrders } from "../../api/order";
import type { OrderCreate, PurchaseType } from "../../api/order";
import { useCartStore } from "../../store/cartStore";

export function useOrders(purchaseType?: PurchaseType) {
  return useQuery({
    queryKey: ["orders", purchaseType ?? "all"],
    queryFn: () => getOrders(purchaseType),
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: () => getOrder(id),
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { removeItem } = useCartStore();

  return useMutation({
    mutationFn: (data: OrderCreate) => createOrder(data),
    onSuccess: (order, variables) => {
      // Remove ordered items from client cart store
      variables.product_ids.forEach((id) => removeItem(id));
      // Invalidate server cart cache
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      // Order may have persisted a new personal address (save_address: true).
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      navigate(`/checkout/confirmation/${order.id}`);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
