import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import type { ReactNode } from "react";

export default function AdminRoute({ children }: { children: ReactNode }) {
  const { accessToken, user } = useAuthStore();

  // No token at all — send to login
  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  // Token exists but user profile not yet loaded — show spinner
  // This covers the brief window between page load and profile fetch
  if (!user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FAF7F4",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            border: "2px solid #EDE8E3",
            borderTop: "2px solid #C4985A",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  // Token exists, user loaded, but not staff — send to home
  if (!user.is_staff) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
