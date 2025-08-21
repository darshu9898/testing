import "@/styles/globals.css";
import Navbar from "@/components/NavBar";
import { AuthProvider } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <AuthProvider>
      <Navbar />
      <AnimatePresence mode="wait" initial={false}>
        {isMounted && (
          <motion.div
            key={router.route}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen bg-white"
          >
            <Component {...pageProps} />
          </motion.div>
        )}
        {!isMounted && (
          <div className="min-h-screen bg-white">
            <Component {...pageProps} />
          </div>
        )}
      </AnimatePresence>
    </AuthProvider>
  );
}