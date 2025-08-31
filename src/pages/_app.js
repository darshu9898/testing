import "@/styles/globals.css";
import Navbar from "@/components/NavBar";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/contexts/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";

// Enhanced BigInt serialization fix - apply as early as possible
// This needs to run before any JSON.stringify calls happen
if (typeof BigInt !== "undefined") {
  // Check if toJSON already exists to avoid overriding
  if (!BigInt.prototype.toJSON) {
    BigInt.prototype.toJSON = function () {
      return this.toString();
    };
  }
  
  // Also ensure this is applied in Node.js environment (for API routes)
  if (typeof global !== "undefined" && global.BigInt && !global.BigInt.prototype.toJSON) {
    global.BigInt.prototype.toJSON = function () {
      return this.toString();
    };
  }
}

// Additional safety check for environments that might not support BigInt
try {
  if (typeof BigInt !== "undefined") {
    // Test the fix works
    const testBigInt = BigInt(123);
    JSON.stringify({ test: testBigInt });
    console.log("✅ BigInt serialization fix applied successfully");
  }
} catch (error) {
  console.warn("⚠️ BigInt serialization fix may not be working:", error.message);
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