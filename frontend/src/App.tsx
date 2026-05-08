import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import ToastContainer from "@/components/ToastContainer";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import AdminLayout from "@/admin/AdminLayout";
import AdminOverviewPage from "@/admin/AdminOverviewPage";
import AdminOrdersPage from "@/admin/AdminOrdersPage";
import AdminProductsPage from "@/admin/AdminProductsPage";
import AdminEditProductPage from "@/admin/AdminEditProductPage";
import HomePage from "@/pages/HomePage";
import ShopPage from "@/pages/ShopPage";
import ProductDetailPage from "@/pages/ProductDetailPage";
import CartPage from "@/pages/CartPage";
import { WishlistPage } from "@/pages/WishlistPage";
import ContactPage from "@/pages/ContactPage";
import PrivacyPolicyPage from "@/pages/PrivacyPolicyPage";
import TermsPage from "@/pages/TermsPage";
import ShippingPolicyPage from "@/pages/ShippingPolicyPage";
import ReturnPolicyPage from "@/pages/ReturnPolicyPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import CheckoutPage from "@/pages/CheckoutPage";
import OrderSuccessPage from "@/pages/OrderSuccessPage";
import OrderFailedPage from "@/pages/OrderFailedPage";
import { useAuthStore } from "@/store/authStore";
import api from "@/api/client";
import { SearchProvider } from "@/contexts/SearchContext";
import ErrorBoundary from "@/components/ErrorBoundary";

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
    <ErrorBoundary section="app" fallback={
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "'Inter', sans-serif", color: "#6B5B55" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "22px", fontFamily: "'Cormorant Garamond', serif", marginBottom: "12px" }}>Femvelle</p>
          <p style={{ fontSize: "13px" }}>Something went wrong. Please refresh the page.</p>
        </div>
      </div>
    }>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <SearchProvider>
      <ToastContainer />
      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ShopPage />} />
        <Route path="/products/:slug" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/shipping-policy" element={<ShippingPolicyPage />} />
        <Route path="/returns" element={<ReturnPolicyPage />} />
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
        <Route path="/admin/products/:id/edit" element={<AdminRoute><AdminLayout><AdminEditProductPage /></AdminLayout></AdminRoute>} />
        
        {/* Catch-all route - redirect to products page */}
        <Route path="*" element={<Navigate to="/products" replace />} />
      </Routes>
      </SearchProvider>
    </BrowserRouter>
    </ErrorBoundary>
  );
}
