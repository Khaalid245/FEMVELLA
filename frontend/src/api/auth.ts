import { useMutation } from "@tanstack/react-query";
import api from "./client";
import { useAuthStore } from "@/store/authStore";

export const useLogin = () =>
  useMutation({
    mutationFn: (creds: { email: string; password: string }) =>
      api.post("/auth/token/", creds).then((r) => r.data),
    onSuccess: (data) => useAuthStore.getState().setTokens(data.access, data.refresh),
  });

export const useRegister = () =>
  useMutation({
    mutationFn: (data: { email: string; username: string; password: string }) =>
      api.post("/accounts/register/", data).then((r) => r.data),
  });
