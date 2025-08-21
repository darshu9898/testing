"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router"; // if you're on the App Router, switch to next/navigation
import { useAuth } from "@/hooks/useAuth";
import { ButtonDemo } from "./Button";
import {
  ShoppingCart,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const { user, signOut, loading } = useAuth();
  const router = useRouter();

  // Handle scroll effect (safe on client only)
  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== "undefined") {
        setIsScrolled(window.scrollY > 10);
      }
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch cart count
  useEffect(() => {
    const fetchCartCount = async () => {
      try {
        const response = await fetch("/api/cart", { credentials: "include" });
        if (response.ok) {
          const data = await response.json();
          setCartCount(data.items?.length || 0);
        }
      } catch (error) {
        console.error("Failed to fetch cart count:", error);
      }
    };

    fetchCartCount();
    const interval = setInterval(fetchCartCount, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowUserMenu(false);
      setCartCount(0);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const navigationItems = [
    { name: "Home", href: "/", exact: true },
    { name: "Products", href: "/products" },
    { name: "Contact", href: "/contact" },
    { name: "FAQ", href: "/faq" },
  ];

  return (
    <>
      {/* Main Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled ? "shadow-xl bg-white/95 backdrop-blur-md" : "shadow-lg bg-white"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2 group">
                <div className="bg-gradient-to-r from-[#2F674A] to-[#1F5132] p-2 rounded-lg group-hover:scale-105 transition-transform duration-200">
                  <span className="text-white font-bold text-xl">T</span>
                </div>
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
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`relative py-2 px-1 text-gray-700 hover:text-[#2F674A] transition-colors duration-200 font-medium group ${
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
            </div>

            {/* Right Side Icons & Auth */}
            <div className="flex items-center space-x-4">
              {/* Cart Icon with Count */}
              <Link href="/cart" className="relative p-2 text-gray-700 hover:text-[#2F674A] transition-colors group">
                <ShoppingCart className="h-5 w-5 group-hover:scale-110 transition-transform" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#2F674A] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>

              {/* User Authentication */}
              {loading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-20 rounded-full"></div>
              ) : user ? (
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
                          onClick={handleSignOut}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link href="/login">
                    <ButtonDemo label="Login" bgColor="green" className="px-4 py-2 text-sm" />
                  </Link>
                  <Link href="/register" className="hidden sm:block">
                    <ButtonDemo label="Sign Up" bgColor="black" className="px-4 py-2 text-sm" />
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden p-2 text-gray-700 hover:text-[#2F674A] transition-colors"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isOpen && (
            <div className="lg:hidden border-t bg-white">
              <div className="px-2 pt-2 pb-3 space-y-1">
                {navigationItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      (item.exact
                        ? router.pathname === item.href
                        : router.pathname.startsWith(item.href))
                        ? "text-[#2F674A] bg-green-50"
                        : "text-gray-700 hover:text-[#2F674A] hover:bg-gray-50"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}

                {user ? (
                  <div className="border-t mt-4 pt-4">
                    <div className="px-3 py-2">
                      <p className="text-base font-medium text-gray-900">
                        {user.user_metadata?.full_name || "User"}
                      </p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <Link href="/profile" className="block px-3 py-2 text-base text-gray-700 hover:text-[#2F674A] hover:bg-gray-50 transition-colors">
                      My Profile
                    </Link>
                    <Link href="/orders" className="block px-3 py-2 text-base text-gray-700 hover:text-[#2F674A] hover:bg-gray-50 transition-colors">
                      My Orders
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-3 py-2 text-base text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="border-t mt-4 pt-4 space-y-2">
                    <Link href="/login" className="block" onClick={() => setIsOpen(false)}>
                      <ButtonDemo label="Login" bgColor="green" className="w-full" />
                    </Link>
                    <Link href="/register" className="block" onClick={() => setIsOpen(false)}>
                      <ButtonDemo label="Sign Up" bgColor="black" className="w-full" />
                    </Link>
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