import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import {
  Bars3Icon,
  XMarkIcon,
  ShoppingBagIcon,
  HeartIcon,
  UserIcon,
  MagnifyingGlassIcon,
  HomeIcon,
  TagIcon,
  InformationCircleIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';

interface MobileNavigationProps {
  cartItemCount: number;
  wishlistItemCount: number;
  isAuthenticated: boolean;
  user?: {
    first_name: string;
    email: string;
  };
  onLogout: () => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  cartItemCount,
  wishlistItemCount,
  isAuthenticated,
  user,
  onLogout
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
    setIsSearchOpen(false);
  }, [location]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  const mainNavItems = [
    { name: 'Home', href: '/', icon: HomeIcon },
    { name: 'Products', href: '/products', icon: TagIcon },
    { name: 'About', href: '/about', icon: InformationCircleIcon },
    { name: 'Contact', href: '/contact', icon: PhoneIcon },
  ];

  const userNavItems = isAuthenticated ? [
    { name: 'Profile', href: '/profile', icon: UserIcon },
    { name: 'Orders', href: '/orders', icon: ShoppingBagIcon },
    { name: 'Wishlist', href: '/wishlist', icon: HeartIcon, badge: wishlistItemCount },
  ] : [
    { name: 'Login', href: '/login', icon: UserIcon },
    { name: 'Register', href: '/register', icon: UserIcon },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results
      window.location.href = `/products?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <>
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Menu Button */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-2 -ml-2 rounded-lg active:scale-95 transition-transform"
            aria-label="Open menu"
          >
            <Bars3Icon className="w-6 h-6 text-gray-700" />
          </button>

          {/* Logo */}
          <Link to="/" className="flex-1 flex justify-center">
            <h1 className="text-xl font-bold text-[#2C2420] font-serif">
              FEMVELLE
            </h1>
          </Link>

          {/* Right Actions */}
          <div className="flex items-center space-x-2">
            {/* Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 rounded-lg active:scale-95 transition-transform"
              aria-label="Search"
            >
              <MagnifyingGlassIcon className="w-6 h-6 text-gray-700" />
            </button>

            {/* Cart Button */}
            <Link
              to="/cart"
              className="p-2 rounded-lg active:scale-95 transition-transform relative"
              aria-label="Shopping cart"
            >
              <ShoppingBagIcon className="w-6 h-6 text-gray-700" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#C4985A] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Full Screen Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white z-50"
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-lg active:scale-95 transition-transform"
                aria-label="Close menu"
              >
                <XMarkIcon className="w-6 h-6 text-gray-700" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* User Section */}
              {isAuthenticated && user && (
                <div className="px-4 py-6 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-[#C4985A] rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-lg">
                        {user.first_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Hello, {user.first_name}!
                      </p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Main Navigation */}
              <div className="py-4">
                <div className="px-4 mb-4">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Navigation
                  </h3>
                </div>
                <nav className="space-y-1">
                  {mainNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.href;
                    
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`flex items-center space-x-3 px-4 py-3 text-base font-medium transition-colors active:scale-95 ${
                          isActive
                            ? 'text-[#C4985A] bg-[#C4985A]/10'
                            : 'text-gray-700 hover:text-[#C4985A] hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* User Navigation */}
              <div className="py-4 border-t border-gray-200">
                <div className="px-4 mb-4">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Account
                  </h3>
                </div>
                <nav className="space-y-1">
                  {userNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.href;
                    
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`flex items-center justify-between px-4 py-3 text-base font-medium transition-colors active:scale-95 ${
                          isActive
                            ? 'text-[#C4985A] bg-[#C4985A]/10'
                            : 'text-gray-700 hover:text-[#C4985A] hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className="w-6 h-6" />
                          <span>{item.name}</span>
                        </div>
                        {item.badge && item.badge > 0 && (
                          <span className="bg-[#C4985A] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                            {item.badge > 99 ? '99+' : item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Logout Button */}
              {isAuthenticated && (
                <div className="px-4 py-4 border-t border-gray-200">
                  <button
                    onClick={onLogout}
                    className="w-full text-left px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors active:scale-95"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Modal */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white z-50"
          >
            {/* Search Header */}
            <div className="flex items-center space-x-4 px-4 py-3 border-b border-gray-200">
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-2 -ml-2 rounded-lg active:scale-95 transition-transform"
                aria-label="Close search"
              >
                <XMarkIcon className="w-6 h-6 text-gray-700" />
              </button>
              
              <form onSubmit={handleSearch} className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C4985A] focus:border-transparent text-base"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-[#C4985A] active:scale-95 transition-all"
                  >
                    <MagnifyingGlassIcon className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>

            {/* Search Content */}
            <div className="flex-1 p-4">
              {searchQuery.trim() ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Search for "{searchQuery}"
                  </h3>
                  <button
                    onClick={handleSearch}
                    className="w-full bg-[#C4985A] text-white py-3 rounded-lg font-medium active:scale-95 transition-transform"
                  >
                    Search Products
                  </button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <MagnifyingGlassIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Search Products
                  </h3>
                  <p className="text-gray-500">
                    Find your perfect modest fashion pieces
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileNavigation;