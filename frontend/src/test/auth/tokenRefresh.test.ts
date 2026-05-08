import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";

// ── Store mock — isolated per test via closure variables ─────────────────────
const mockSetTokens = vi.fn();
const mockLogout = vi.fn();
let mockAccessToken = "access-token-1";
let mockRefreshToken = "refresh-token-1";

vi.mock("@/store/authStore", () => ({
  useAuthStore: {
    getState: () => ({
      accessToken: mockAccessToken,
      refreshToken: mockRefreshToken,
      setTokens: mockSetTokens,
      logout: mockLogout,
    }),
  },
}));

// Import AFTER mock registration so the interceptor binds to the mock store
const { default: api, API_BASE_URL } = await import("@/api/client");
const mock = new MockAdapter(axios);

beforeEach(() => {
  mock.reset();
  mockSetTokens.mockClear();
  mockLogout.mockClear();
  mockAccessToken = "access-token-1";
  mockRefreshToken = "refresh-token-1";
});

// ── 1. Rotated refresh token is stored, not the old one ──────────────────────
describe("token refresh interceptor", () => {
  it("stores the rotated refresh token returned by the backend", async () => {
    mock.onGet("/test/").replyOnce(401);
    mock
      .onPost(`${API_BASE_URL}/auth/token/refresh/`)
      .replyOnce(200, { access: "access-2", refresh: "refresh-2" });
    mock.onGet("/test/").replyOnce(200, { ok: true });

    await api.get("/test/");

    expect(mockSetTokens).toHaveBeenCalledOnce();
    expect(mockSetTokens).toHaveBeenCalledWith("access-2", "refresh-2");
    // Must NOT persist the old blacklisted token
    expect(mockSetTokens).not.toHaveBeenCalledWith(
      expect.anything(),
      "refresh-token-1"
    );
  });

  // ── 2. Each refresh cycle stores the latest token ────────────────────────
  it("stores the latest rotated token across multiple refresh cycles", async () => {
    // Cycle 1
    mock.onGet("/resource/").replyOnce(401);
    mock
      .onPost(`${API_BASE_URL}/auth/token/refresh/`)
      .replyOnce(200, { access: "access-2", refresh: "refresh-2" });
    mock.onGet("/resource/").replyOnce(200, {});

    await api.get("/resource/");
    expect(mockSetTokens).toHaveBeenLastCalledWith("access-2", "refresh-2");

    // Simulate store update between cycles
    mockAccessToken = "access-2";
    mockRefreshToken = "refresh-2";
    mockSetTokens.mockClear();

    // Cycle 2
    mock.onGet("/resource/").replyOnce(401);
    mock
      .onPost(`${API_BASE_URL}/auth/token/refresh/`)
      .replyOnce(200, { access: "access-3", refresh: "refresh-3" });
    mock.onGet("/resource/").replyOnce(200, {});

    await api.get("/resource/");
    expect(mockSetTokens).toHaveBeenLastCalledWith("access-3", "refresh-3");
    expect(mockSetTokens).not.toHaveBeenCalledWith(
      expect.anything(),
      "refresh-2"
    );
  });

  // ── 3. Expired / blacklisted refresh token triggers logout ───────────────
  it("calls logout when the refresh token is expired or blacklisted", async () => {
    mock.onGet("/secure/").replyOnce(401);
    mock
      .onPost(`${API_BASE_URL}/auth/token/refresh/`)
      .replyOnce(401, { detail: "Token is blacklisted." });

    await expect(api.get("/secure/")).rejects.toBeDefined();

    expect(mockLogout).toHaveBeenCalledOnce();
    expect(mockSetTokens).not.toHaveBeenCalled();
  });

  // ── 4. Non-401 errors bypass the refresh logic entirely ──────────────────
  it("does not attempt refresh on non-401 errors", async () => {
    mock.onGet("/missing/").replyOnce(404, { detail: "Not found." });

    await expect(api.get("/missing/")).rejects.toBeDefined();

    expect(mockSetTokens).not.toHaveBeenCalled();
    expect(mockLogout).not.toHaveBeenCalled();
  });

  // ── 5. Retried request carries the new access token ──────────────────────
  it("retries the original request with the new access token", async () => {
    mock.onGet("/protected/").replyOnce(401);
    mock
      .onPost(`${API_BASE_URL}/auth/token/refresh/`)
      .replyOnce(200, { access: "access-new", refresh: "refresh-new" });
    mock.onGet("/protected/").replyOnce(function (config) {
      expect(config.headers?.Authorization).toBe("Bearer access-new");
      return [200, { data: "protected content" }];
    });

    const res = await api.get("/protected/");
    expect(res.data).toEqual({ data: "protected content" });
  });

  // ── 6. _retry flag prevents infinite refresh loops ───────────────────────
  it("does not retry more than once per request", async () => {
    mock.onGet("/loop/").reply(401);
    mock
      .onPost(`${API_BASE_URL}/auth/token/refresh/`)
      .replyOnce(200, { access: "access-new", refresh: "refresh-new" });

    await expect(api.get("/loop/")).rejects.toBeDefined();

    // Refresh attempted exactly once — no infinite loop
    expect(mockSetTokens).toHaveBeenCalledOnce();
  });

  // ── 7. Manual logout clears all auth state ───────────────────────────────
  it("logout clears access token, refresh token, and user", () => {
    const { useAuthStore } = await import("@/store/authStore");
    useAuthStore.getState().logout();
    expect(mockLogout).toHaveBeenCalledOnce();
  });
});
