import { Link } from "react-router-dom";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";

export default function Navbar() {
  const itemCount = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const { accessToken, logout } = useAuthStore();

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link to="/" className="font-serif text-2xl font-bold text-brand-600 tracking-wide">
          Femvelle
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-700">
          <Link to="/products" className="hover:text-brand-600 transition-colors">Shop</Link>
          <Link to="/contact" className="hover:text-brand-600 transition-colors">Contact</Link>
          <Link to="/blog" className="hover:text-brand-600 transition-colors">Blog</Link>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/cart" className="relative text-gray-700 hover:text-brand-600">
            <span>Cart</span>
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-brand-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>
          {accessToken ? (
            <button onClick={logout} className="text-sm text-gray-600 hover:text-brand-600">Logout</button>
          ) : (
            <Link to="/login" className="text-sm font-medium text-brand-600 hover:text-brand-700">Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
