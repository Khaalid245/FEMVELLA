import { useMutation } from "@tanstack/react-query";
import api from "./client";
import { useAuthStore } from "@/store/authStore";

export const useLogin = () =>
  useMutation({
    mutationFn: async (creds: { email: string; password: string }) => {
      // Step 1 — get tokens
      const { data: tokens } = await api.post("/auth/token/", creds);
      useAuthStore.getState().setTokens(tokens.access, tokens.refresh);

      // Step 2 — fetch profile with the new token (guaranteed before onSuccess fires)
      const { data: profile } = await api.get("/accounts/profile/");
      useAuthStore.getState().setUser(profile);

      return profile; // returned as mutation data
    },
  });

export const useRegister = () =>
  useMutation({
    mutationFn: (data: { email: string; username: string; password: string }) =>
      api.post("/accounts/register/", data).then((r) => r.data),
  });
