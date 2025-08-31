import "@/styles/globals.css";
import Navbar from "@/components/NavBar";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/contexts/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";

// Fix BigInt serialization globally
if (typeof BigInt !== "undefined") {
  BigInt.prototype.toJSON = function () {
    return this.toString(); // Convert BigInt to string
  };
}

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't render anything until mounted to prevent hydration issues
  if (!isMounted) {
    return null;
  }

  return (
    <AuthProvider>
      <CartProvider>
        {/* Navbar must be inside CartProvider to access cart context */}
        <Navbar />
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={router.route}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.15 }}
            className="min-h-screen bg-white"
          >
            <Component {...pageProps} />
          </motion.div>
        </AnimatePresence>
      </CartProvider>
    </AuthProvider>
  );
}