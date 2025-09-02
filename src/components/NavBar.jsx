"use client";
import { useState, useEffect, memo } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/hooks/useAuth";
import { useCartCount } from "@/contexts/CartContext";
import Image from "next/image";
import {
  ShoppingCart,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";

// Memoized cart icon component to prevent unnecessary re-renders
const CartIcon = memo(() => {
  const cartCount = useCartCount();
  
  return (
    <Link href="/cart" className="relative p-2 text-gray-700 hover:text-[#2F674A] transition-colors group">
      <ShoppingCart className="h-5 w-5 group-hover:scale-110 transition-transform" />
      {cartCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-[#2F674A] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
          {cartCount > 99 ? "99+" : cartCount}
        </span>
      )}
    </Link>
  );
});

CartIcon.displayName = 'CartIcon';

// Memoized user menu component
const UserMenu = memo(({ user, showUserMenu, setShowUserMenu, onSignOut }) => {
  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setShowUserMenu(!showUserMenu)}
        className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
      >
        <div className="h-8 w-8 bg-gradient-to-r from-[#2F674A] to-[#1F5132] rounded-full flex items-center justify-center text-white text-sm font-bold">
          {user.user_metadata?.full_name?.[0] || user.email?.[0] || "U"}
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showUserMenu ? "rotate-180" : ""}`} />
      </button>

      {/* User Dropdown */}
      {showUserMenu && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border py-2 z-50">
          <div className="px-4 py-2 border-b">
            <p className="text-sm font-medium text-gray-900">
              {user.user_metadata?.full_name || "User"}
            </p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
          <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
            My Profile
          </Link>
          <Link href="/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
            My Orders
          </Link>
          <Link href="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
            Settings
          </Link>
          <div className="border-t mt-2 pt-2">
            <button
              onClick={onSignOut}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

UserMenu.displayName = 'UserMenu';

// Memoized navigation items
const NavigationItems = memo(({ router, className = "" }) => {
  const navigationItems = [
    { name: "Home", href: "/", exact: true },
    { name: "Products", href: "/products" },
    { name: "Contact", href: "/contact" },
    { name: "FAQ", href: "/faq" },
  ];

  return (
    <>
      {navigationItems.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className={`${className} relative py-2 px-1 text-gray-700 hover:text-[#2F674A] transition-colors duration-200 font-medium group ${
            (item.exact
              ? router.pathname === item.href
              : router.pathname.startsWith(item.href))
              ? "text-[#2F674A]"
              : ""
          }`}
        >
          {item.name}
          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#2F674A] transition-all duration-200 group-hover:w-full"></span>
        </Link>
      ))}
    </>
  );
});

NavigationItems.displayName = 'NavigationItems';

// Memoized auth buttons
const AuthButtons = memo(({ onLoginClick, onRegisterClick }) => (
  <div className="flex items-center space-x-2">
    <button
      onClick={onLoginClick}
      className="px-4 py-2 text-sm bg-[#2F674A] text-white hover:bg-green-700 rounded transition-colors font-medium cursor-pointer"
      type="button"
    >
      Login
    </button>
    <button
      onClick={onRegisterClick}
      className="hidden sm:block px-4 py-2 text-sm bg-black text-white hover:bg-gray-800 rounded transition-colors font-medium cursor-pointer"
      type="button"
    >
      Sign Up
    </button>
  </div>
));

AuthButtons.displayName = 'AuthButtons';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [navbarReady, setNavbarReady] = useState(false);

  const { user, signOut, loading } = useAuth();
  const router = useRouter();

  // Handle mounting and prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Set navbar as ready only after auth is initialized
  useEffect(() => {
    if (mounted && !loading) {
      setNavbarReady(true);
    }
  }, [mounted, loading]);

  // Handle scroll effect (safe on client only)
  useEffect(() => {
    if (!navbarReady) return;
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [navbarReady]);

  // Memoized event handlers to prevent unnecessary re-renders
  const handleSignOut = async () => {
    try {
      await signOut();
      setShowUserMenu(false);
      router.push('/login');
    } catch (error) {
      console.error("❌ NavBar: Sign out error:", error);
    }
  };

  const handleNavClick = (href) => {
    setIsOpen(false);
    router.push(href);
  };

  const handleLoginClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
    setShowUserMenu(false);
    
    try {
      await router.push('/login');
    } catch (error) {
      console.error('❌ NavBar: Navigation error:', error);
    }
  };

  const handleRegisterClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
    setShowUserMenu(false);
    
    try {
      await router.push('/register');
    } catch (error) {
      console.error('❌ NavBar: Navigation error:', error);
    }
  };

  // Show loading state until navbar is ready
  if (!navbarReady) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Image
              src="/logo2.png"   // make sure it's in public/
              alt="Trivedam Logo"
              width={40}
              height={40}
              className="object-contain"
            />
            <div className="ml-2">
              <span className="text-2xl font-bold text-[#2F674A]">Trivedam</span>
              <div className="text-xs text-gray-500 -mt-1">Ayurvedic Wellness</div>
            </div>
          </div>

          {/* Loading state */}
          <div className="flex items-center space-x-4">
            <div className="animate-pulse bg-gray-200 h-8 w-8 rounded-full"></div>
            <div className="animate-pulse bg-gray-200 h-8 w-20 rounded-full"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      {/* Main Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "shadow-xl bg-white/95 backdrop-blur-md" : "shadow-lg bg-white"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2 group">
                <Image
                  src="/logo2.png"   // place logo.png inside public/
                  alt="Trivedam Logo"
                  width={40}
                  height={60}
                  className="object-contain"
                />
                <div>
                  <span className="text-2xl font-bold text-[#2F674A] group-hover:text-[#1F5132] transition-colors">
                    Trivedam
                  </span>
                  <div className="text-xs text-gray-500 -mt-1">Ayurvedic Wellness</div>
                </div>
              </Link>
            </div>


            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              <NavigationItems router={router} />
            </div>

            {/* Right Side Icons & Auth */}
            <div className="flex items-center space-x-4">
              {/* Cart Icon with Optimized Count */}
              <CartIcon />

              {/* User Authentication */}
              {loading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-20 rounded-full"></div>
              ) : user ? (
                <UserMenu 
                  user={user} 
                  showUserMenu={showUserMenu} 
                  setShowUserMenu={setShowUserMenu} 
                  onSignOut={handleSignOut} 
                />
              ) : (
                <AuthButtons 
                  onLoginClick={handleLoginClick} 
                  onRegisterClick={handleRegisterClick} 
                />
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden p-2 text-gray-700 hover:text-[#2F674A] transition-colors z-50 relative"
                type="button"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isOpen && (
            <div className="lg:hidden border-t bg-white absolute top-full left-0 right-0 z-40 shadow-lg">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <NavigationItems 
                  router={router} 
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors text-gray-700 hover:text-[#2F674A] hover:bg-gray-50" 
                />

                {user ? (
                  <div className="border-t mt-4 pt-4">
                    <div className="px-3 py-2">
                      <p className="text-base font-medium text-gray-900">
                        {user.user_metadata?.full_name || "User"}
                      </p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <button
                      onClick={() => handleNavClick('/profile')}
                      className="block w-full text-left px-3 py-2 text-base text-gray-700 hover:text-[#2F674A] hover:bg-gray-50 transition-colors"
                      type="button"
                    >
                      My Profile
                    </button>
                    <button
                      onClick={() => handleNavClick('/orders')}
                      className="block w-full text-left px-3 py-2 text-base text-gray-700 hover:text-[#2F674A] hover:bg-gray-50 transition-colors"
                      type="button"
                    >
                      My Orders
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-3 py-2 text-base text-red-600 hover:bg-red-50 transition-colors"
                      type="button"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="border-t mt-4 pt-4 space-y-2">
                    <button
                      onClick={handleLoginClick}
                      className="block w-full text-center px-3 py-2 text-sm bg-[#2F674A] text-white hover:bg-green-700 rounded transition-colors font-medium cursor-pointer"
                      type="button"
                    >
                      Login
                    </button>
                    <button
                      onClick={handleRegisterClick}
                      className="block w-full text-center px-3 py-2 text-sm bg-black text-white hover:bg-gray-800 rounded transition-colors font-medium cursor-pointer"
                      type="button"
                    >
                      Sign Up
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div className="fixed inset-0 z-30" onClick={() => setShowUserMenu(false)} />
      )}

      {/* Spacer for fixed navbar */}
      <div className="h-16" />
    </>
  );
}