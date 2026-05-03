import { useState, FormEvent } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import Layout from "@/components/Layout";
import Button from "@/components/Button";
import { useLogin } from "@/api/auth";
import type { AuthUser } from "@/store/authStore";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { mutate, isPending, error } = useLogin();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutate(
      { email, password },
      {
        onSuccess: (user: AuthUser) => {
          // Redirect admin users to admin dashboard
          if (user.is_staff) {
            navigate("/admin", { replace: true });
            return;
          }
          // Redirect regular users to where they came from or home
          const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/";
          navigate(from, { replace: true });
        },
      }
    );
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto py-16">
        <h1 className="font-serif text-3xl font-bold text-gray-900 mb-8 text-center">
          Welcome Back
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          {error && (
            <p className="text-red-500 text-sm">
              Invalid email or password. Please try again.
            </p>
          )}
          <Button size="lg" className="w-full" type="submit" disabled={isPending}>
            {isPending ? "Signing in..." : "Sign In"}
          </Button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{" "}
          <Link to="/register" className="text-brand-600 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </Layout>
  );
}
