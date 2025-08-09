import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function Navbar() {
  const router = useRouter();
  const greenBg = "#2F674A";

  function linkClass(href) {
    const isActive = router.pathname === href;
    return {
      className: `px-3 py-2 text-sm font-medium rounded-md cursor-pointer ${
        isActive ? "text-white" : "text-black hover:bg-[#DDE6D9]"
      }`,
      style: {
        backgroundColor: isActive ? greenBg : "transparent",
      },
      "aria-current": isActive ? "page" : undefined,
    };
  }

  return (
    <nav className="bg-[#F8F0E1]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Left: Logo */}
          <div className="flex-shrink-0">
            <img
              src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500"
              alt="Logo"
              className="h-8 w-auto"
            />
          </div>

          {/* Center: Nav links */}
          <div className="flex space-x-8">
            <Link href="/" {...linkClass("/")}>
              Home
            </Link>
            <Link href="/products" {...linkClass("/products")}>
              Products
            </Link>
            <Link href="/contact" {...linkClass("/contact")}>
              Contact
            </Link>
            <Link href="/faq" {...linkClass("/faq")}>
              FAQ
            </Link>
          </div>

          {/* Right: Notifications + Profile */}
          <div className="flex items-center space-x-4">
            <button
              type="button"
              className="p-1 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="View notifications"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
                className="h-6 w-6"
              >
                <path
                  d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button className="relative rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <span className="sr-only">Open user menu</span>
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e"
                alt="Profile"
                className="h-8 w-8 rounded-full"
              />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
