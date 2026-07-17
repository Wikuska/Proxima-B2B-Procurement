import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  advanceOrderStatus,
  confirmPayment,
  createOrder,
  getCheckoutOptions,
  getOrder,
  getOrders,
  mockPayment,
} from "../../api/order";
import type { OrderCreate, PaymentMethod, PurchaseType } from "../../api/order";
import { useCartStore } from "../../store/cartStore";

export function useOrders(purchaseType?: PurchaseType) {
  return useQuery({
    queryKey: ["orders", purchaseType ?? "all"],
    queryFn: () => getOrders(purchaseType),
  });
}

export function useCheckoutOptions() {
  return useQuery({
    queryKey: ["orders", "checkout-options"],
    queryFn: getCheckoutOptions,
    staleTime: Infinity,
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

      const redirectMethods: PaymentMethod[] = ["CARD", "BLIK"];
      if (
        redirectMethods.includes(order.payment_method) &&
        order.status === "PENDING_PAYMENT"
      ) {
        navigate(`/checkout/payment/${order.id}`);
      } else {
        navigate(`/checkout/confirmation/${order.id}`);
      }
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

function invalidateOrder(queryClient: ReturnType<typeof useQueryClient>, orderId: string) {
  queryClient.invalidateQueries({ queryKey: ["orders"] });
  queryClient.invalidateQueries({ queryKey: ["orders", orderId] });
}

export function useMockPayment(orderId: string) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (success: boolean) => mockPayment(orderId, success),
    onSuccess: (order, success) => {
      invalidateOrder(queryClient, orderId);
      if (success) {
        navigate(`/checkout/confirmation/${order.id}`);
      }
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useConfirmPayment(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => confirmPayment(orderId),
    onSuccess: () => {
      invalidateOrder(queryClient, orderId);
      toast.success("Payment confirmed. Your order is being prepared.");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useAdvanceOrderStatus(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => advanceOrderStatus(orderId),
    onSuccess: (order) => {
      invalidateOrder(queryClient, orderId);
      toast.success(`Order status updated to ${order.status.replace(/_/g, " ")}.`);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
