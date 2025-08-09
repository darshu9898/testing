import "@/styles/globals.css";
import Navbar from "@/components/NavBar";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  // After mounting on client, set flag true to trigger animation
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <>
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
        {/* Optionally render the component without animation until mounted */}
        {!isMounted && (
          <div className="min-h-screen bg-white">
            <Component {...pageProps} />
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
