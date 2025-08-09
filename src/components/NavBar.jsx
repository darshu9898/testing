import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

const buttons = [
  { name: "home", href: "/", label: "Home" },
  { name: "products", href: "/products", label: "Products" },
  { name: "contact", href: "/contact", label: "Contact" },
  { name: "faq", href: "/faq", label: "FAQ" },
];

const shiftAmount = 20; // px to shift left/right for other buttons

const Navbar = () => {
  const router = useRouter();
  const [hovered, setHovered] = useState(null);
  const greenBg = "#2F674A";

  // Return styles per button based on position relative to hovered button
  function getTransform(index) {
    if (hovered === null) return "translateX(0)";
    const hoveredIndex = buttons.findIndex((b) => b.name === hovered);
    if (index === hoveredIndex) return "translateX(0) scale(1.1)";
    if (index < hoveredIndex) return `translateX(-${shiftAmount}px) scale(0.9)`;
    if (index > hoveredIndex) return `translateX(${shiftAmount}px) scale(0.9)`;
    return "translateX(0)";
  }

  // Classes for each button (background, text) + transition
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

  return (
    <nav className="bg-[#F8F0E1] fixed top-0 w-full z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 flex h-16 items-center justify-between">
        {/* Left: Logo */}
        <div className="flex-shrink-0">
          <img
            src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500"
            alt="Logo"
            className="h-8 w-auto"
          />
        </div>

        {/* Center: Nav Links */}
        <div className="flex space-x-6 relative" style={{ minWidth: "320px" }}>
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

        {/* Right: Notifications + Profile */}
        <div className="flex items-center space-x-4">
          <button
            type="button"
            className="p-1 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
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
    </nav>
  );
};

export default Navbar;
