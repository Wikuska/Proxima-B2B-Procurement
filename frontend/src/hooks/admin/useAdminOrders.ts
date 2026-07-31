import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  advanceAdminOrderStatus,
  fetchAdminOrder,
  fetchAdminOrders,
} from "../../api/adminOrders";
import type { OrderStatus } from "../../api/order";
import { ORDER_STATUS_LABELS } from "../../api/order";

export function useAdminOrders(status?: OrderStatus) {
  return useQuery({
    queryKey: ["admin-orders", status ?? "all"],
    queryFn: ({ signal }) => fetchAdminOrders(status, signal),
  });
}

export function useAdminOrder(orderId: string | undefined) {
  return useQuery({
    queryKey: ["admin-order", orderId],
    queryFn: ({ signal }) => fetchAdminOrder(orderId!, signal),
    enabled: !!orderId,
  });
}

export function useAdvanceAdminOrderStatus(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => advanceAdminOrderStatus(orderId),
    onSuccess: (order) => {
      queryClient.setQueryData(["admin-order", orderId], order);
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success(
        `Order status updated to ${ORDER_STATUS_LABELS[order.status]}.`,
      );
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
