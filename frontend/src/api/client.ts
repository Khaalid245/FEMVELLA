import axios from "axios";
import { useAuthStore } from "@/store/authStore";

const rawApiUrl = import.meta.env.VITE_API_URL;
if (!rawApiUrl) {
  throw new Error(
    "[Femvelle] Missing VITE_API_URL environment variable. " +
    "Set it in .env (development) or your deployment environment (production)."
  );
}

const trimmedApiUrl = rawApiUrl.replace(/\/+$/, "");
export const API_BASE_URL = trimmedApiUrl.endsWith("/api") ? trimmedApiUrl : `${trimmedApiUrl}/api`;
export const MEDIA_BASE_URL = API_BASE_URL.replace(/\/api$/, "");

const api = axios.create({ 
  baseURL: API_BASE_URL
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = useAuthStore.getState().refreshToken;
        const { data } = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, { refresh });
        useAuthStore.getState().setTokens(data.access, data.refresh);
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
