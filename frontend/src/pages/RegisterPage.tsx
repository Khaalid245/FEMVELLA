import { useState, FormEvent } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import Layout from "@/components/Layout";
import Button from "@/components/Button";
import { useRegister } from "@/api/auth";

function extractRegisterError(error: unknown): string {
  const data = (error as any)?.response?.data;
  // Custom exception handler wraps field errors under `detail`
  const fields = data?.detail ?? data;
  if (fields && typeof fields === "object") {
    for (const key of ["email", "username", "password", "non_field_errors"]) {
      const msg = fields[key];
      if (Array.isArray(msg) && msg[0]) return String(msg[0]);
      if (typeof msg === "string" && msg) return msg;
    }
  }
  return "Registration failed. Please try again.";
}

export default function RegisterPage() {
  const [form, setForm] = useState({ email: "", username: "", password: "" });
  const navigate = useNavigate();
  const location = useLocation();
  const { mutate, isPending, error } = useRegister();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutate(form, { onSuccess: () => navigate("/login", { state: location.state }) });
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto py-16">
        <h1 className="font-serif text-3xl font-bold text-gray-900 mb-8 text-center">Create Account</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {(["email", "username", "password"] as const).map((field) => (
            <input key={field} type={field === "password" ? "password" : "text"} placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
              value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} required
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          ))}
          {error && <p className="text-red-500 text-sm">{extractRegisterError(error)}</p>}
          <Button size="lg" className="w-full" type="submit" disabled={isPending}>
            {isPending ? "Creating account..." : "Register"}
          </Button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account? <Link to="/login" state={location.state} className="text-brand-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </Layout>
  );
}
