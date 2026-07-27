import { useQuery } from "@tanstack/react-query";
import { getCompanyOrder, getCompanyOrders } from "../../api/company";
import type { OrderStatus } from "../../api/order";

export const useCompanyOrders = (status?: OrderStatus) =>
  useQuery({
    queryKey: ["company-orders", status ?? "all"],
    queryFn: () => getCompanyOrders(status),
  });

export const useCompanyOrder = (orderId: string) =>
  useQuery({
    queryKey: ["company-orders", orderId],
    queryFn: () => getCompanyOrder(orderId),
    enabled: !!orderId,
  });
