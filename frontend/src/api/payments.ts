import { useMutation } from "@tanstack/react-query";
import api from "./client";

export const useCreatePaymentIntent = () =>
  useMutation({
    mutationFn: (orderId: number) =>
      api
        .post<{ client_secret: string }>("/payments/create-intent/", { order_id: orderId })
        .then((r) => r.data.client_secret),
  });
