import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  id: number;
  email: string;
  username: string;
  is_staff: boolean;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  setTokens: (access: string, refresh: string) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
}

/**
 * Decode a JWT and return its expiry timestamp (seconds since epoch).
 * Returns null if the token is missing or malformed.
 */
function getTokenExpiry(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    return typeof decoded.exp === "number" ? decoded.exp : null;
  } catch {
    return null;
  }
}

/**
 * Returns true if the refresh token is absent or its exp claim is in the past.
 * A 10-second buffer avoids accepting a token that expires mid-request.
 */
export function isRefreshTokenExpired(token: string | null): boolean {
  if (!token) return true;
  const exp = getTokenExpiry(token);
  if (exp === null) return true;
  return Date.now() / 1000 >= exp - 10;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setTokens: (access, refresh) => set({ accessToken: access, refreshToken: refresh }),
      setUser: (user) => set({ user }),
      logout: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    { name: "femvelle-auth" }
  )
);
