import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface ProtectedWishlistRouteProps {
  children: React.ReactNode;
}

export const ProtectedWishlistRoute: React.FC<ProtectedWishlistRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login with return URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};