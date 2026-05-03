import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import ToastContainer from "@/components/ToastContainer";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import AdminLayout from "@/admin/AdminLayout";
import AdminOverviewPage from "@/admin/AdminOverviewPage";
import AdminOrdersPage from "@/admin/AdminOrdersPage";
import AdminProductsPage from "@/admin/AdminProductsPage";
import HomePage from "@/pages/HomePage";
import ShopPage from "@/pages/ShopPage";
import ProductDetailPage from "@/pages/ProductDetailPage";
import CartPage from "@/pages/CartPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import CheckoutPage from "@/pages/CheckoutPage";
import OrderSuccessPage from "@/pages/OrderSuccessPage";
import OrderFailedPage from "@/pages/OrderFailedPage";
import { useAuthStore } from "@/store/authStore";
import api from "@/api/client";

export default function App() {
  const { accessToken, user, setUser, logout } = useAuthStore();

  // On app load: if token exists but user object is missing (e.g. after hard refresh),
  // re-fetch the profile so AdminRoute has the is_staff flag.
  // Runs ONCE on mount only — never triggers navigation itself.
  useEffect(() => {
    if (accessToken && !user) {
      api.get("/accounts/profile/")
        .then((r) => setUser(r.data))
        .catch(() => logout());
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ToastContainer />
      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ShopPage />} />
        <Route path="/products/:slug" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Customer protected */}
        <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
        <Route path="/order-success/:orderId" element={<ProtectedRoute><OrderSuccessPage /></ProtectedRoute>} />
        <Route path="/order-failed/:orderId" element={<ProtectedRoute><OrderFailedPage /></ProtectedRoute>} />

        {/* Admin protected */}
        <Route path="/admin" element={<AdminRoute><AdminLayout><AdminOverviewPage /></AdminLayout></AdminRoute>} />
        <Route path="/admin/orders" element={<AdminRoute><AdminLayout><AdminOrdersPage /></AdminLayout></AdminRoute>} />
        <Route path="/admin/products" element={<AdminRoute><AdminLayout><AdminProductsPage /></AdminLayout></AdminRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
