'use client';

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

const buttons = [
  { name: "home", href: "/", label: "Home" },
  { name: "products", href: "/products", label: "Products" },
  { name: "contact", href: "/contact", label: "Contact" },
  { name: "faq", href: "/faq", label: "FAQ" },
];

const shiftAmount = 20; // px shift on hover for buttons

export default function Navbar() {
  const router = useRouter();
  const [hovered, setHovered] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const greenBg = "#2F674A";

  // Button transform for hover effect
function getTransform(index) {
  // If hovered is null OR hovered is 'cart', don't shift any center button
  if (hovered === null || hovered === 'cart') return "translateX(0)";
  const hoveredIndex = buttons.findIndex((b) => b.name === hovered);
  if (index === hoveredIndex) return "translateX(0) scale(1.1)";
  if (index < hoveredIndex) return `translateX(-${shiftAmount}px) scale(0.9)`;
  if (index > hoveredIndex) return `translateX(${shiftAmount}px) scale(0.9)`;
  return "translateX(0)";
}

  // Button classes with bg/text color
  function getClasses(href, name) {
    const isActive = router.pathname === href;
    const isHovered = hovered === name;

    const bgClass = isActive
      ? "bg-[#2F674A] text-white"
      : isHovered
      ? "bg-[#DDE6D9] text-black"
      : "text-black hover:bg-[#E6F0E8]";

    return `px-4 py-2 rounded-md font-medium cursor-pointer flex items-center justify-center transition-all duration-300 ease-in-out ${bgClass}`;
  }

  // Cart icon classes with hover effect like nav buttons
  const isCartHovered = hovered === 'cart';
  const cartBgClass = isCartHovered
    ? "bg-[#DDE6D9] text-black"
    : "text-black hover:bg-[#E6F0E8]";
  const cartActiveClass = router.pathname === "/cart" ? "bg-[#2F674A] text-white" : "";

  return (
    <nav className="bg-[#F8F0E1] fixed top-0 w-full z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Mobile Left: User & Cart */}
        <div className="flex items-center gap-4 md:hidden">
          {/* User icon */}
          <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <img
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e"
              alt="Profile"
              className="h-8 w-8 rounded-full"
            />
          </button>

          {/* Cart icon */}
          <button
            aria-label="Cart"
            className="p-1 rounded-md hover:bg-gray-300 transition"
          >
            <svg
              className="h-6 w-6 text-black"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                d="M3 3h2l.4 2M7 13h10l4-8H5.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="7" cy="21" r="1" />
              <circle cx="17" cy="21" r="1" />
            </svg>
          </button>
        </div>

        {/* Mobile Center: Trivedam + logo */}
        <div className="flex items-center gap-2 md:hidden mx-auto">
          <span className="font-bold text-lg text-black select-none">
            Trivedam
          </span>
          <img
            src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500"
            alt="Logo"
            className="h-6 w-auto"
          />
        </div>

        {/* Mobile Right: Hamburger */}
        <button
          className="md:hidden p-2 rounded-md hover:bg-gray-300 transition"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg
            className="h-6 w-6 text-black"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            {mobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>

        {/* Desktop Left: Trivedam + logo */}
        <div className="hidden md:flex items-center gap-2">
          <span className="font-bold text-lg text-black select-none">Trivedam</span>
          <img
            src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500"
            alt="Logo"
            className="h-8 w-auto"
          />
        </div>

        {/* Desktop Center: Nav Links */}
        <div className="hidden md:flex space-x-6 relative" style={{ minWidth: "320px" }}>
          {buttons.map(({ name, href, label }, idx) => (
            <Link
              key={name}
              href={href}
              onMouseEnter={() => setHovered(name)}
              onMouseLeave={() => setHovered(null)}
              className={getClasses(href, name)}
              aria-current={router.pathname === href ? "page" : undefined}
              style={{
                transform: getTransform(idx),
                transition: "transform 0.3s ease",
                zIndex: hovered === name ? 10 : 1,
                position: "relative",
              }}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Desktop Right: Cart icon with hover effect */}
        <div className="hidden md:flex items-center space-x-4">
          <Link
            href="/cart"
            onMouseEnter={() => setHovered('cart')}
            onMouseLeave={() => setHovered(null)}
            className={`p-2 rounded-md cursor-pointer flex items-center justify-center transition-all duration-300 ease-in-out ${cartActiveClass || cartBgClass}`}
            aria-current={router.pathname === "/cart" ? "page" : undefined}
            style={{ position: "relative", zIndex: hovered === "cart" ? 10 : 1 }}
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                d="M3 3h2l.4 2M7 13h10l4-8H5.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="7" cy="21" r="1" />
              <circle cx="17" cy="21" r="1" />
            </svg>
          </Link>

          {/* Profile */}
          <button className="relative rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 transition">
            <span className="sr-only">Open user menu</span>
            <img
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e"
              alt="Profile"
              className="h-8 w-8 rounded-full"
            />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#F8F0E1] px-4 py-3 space-y-1 shadow-lg">
          {buttons.map(({ name, href, label }) => (
            <Link
              key={name}
              href={href}
              className={`block px-3 py-2 rounded-md font-medium ${
                router.pathname === href
                  ? "bg-[#2F674A] text-white"
                  : "text-black hover:bg-[#DDE6D9]"
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
