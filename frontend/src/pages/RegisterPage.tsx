import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import Button from "@/components/Button";
import { useRegister } from "@/api/auth";

export default function RegisterPage() {
  const [form, setForm] = useState({ email: "", username: "", password: "" });
  const navigate = useNavigate();
  const { mutate, isPending, error } = useRegister();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutate(form, { onSuccess: () => navigate("/login") });
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
          {error && <p className="text-red-500 text-sm">Registration failed. Please try again.</p>}
          <Button size="lg" className="w-full" type="submit" disabled={isPending}>
            {isPending ? "Creating account..." : "Register"}
          </Button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account? <Link to="/login" className="text-brand-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </Layout>
  );
}
