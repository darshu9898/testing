import "@/styles/globals.css";
import Navbar from "@/components/NavBar";
import Footer from "@/components/Footer"; // ✅ Import Footer
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/contexts/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <AuthProvider>
      <CartProvider>
        <Navbar />
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={router.route}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.15 }}
            className="min-h-screen bg-white flex flex-col"
          >
            <Component {...pageProps} />
            <Footer /> {/* ✅ Footer inside motion container */}
          </motion.div>
        </AnimatePresence>
      </CartProvider>
    </AuthProvider>
  );
}
