import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { createOrder, getOrder, getOrders } from "../../api/order";
import type { OrderCreate } from "../../api/order";
import { useCartStore } from "../../store/cartStore";

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: getOrders,
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
      navigate(`/checkout/confirmation/${order.id}`);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
