"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Info } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return !window.localStorage.getItem("cookie_consent");
  });
  const { t } = useLanguage();

  const acceptCookies = () => {
    localStorage.setItem("cookie_consent", "true");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.5 }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:w-[420px] z-[100] isolate rounded-2xl shadow-2xl overflow-hidden antialiased"
        >
          <div className="absolute inset-0 glass backdrop-blur-xl bg-brand-60/80 border border-brand-10/10 rounded-2xl pointer-events-none"></div>
          <div className="relative z-10 p-5 flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <Info size={24} className="text-brand-30 shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-brand-10/80 leading-relaxed">
                {t.cookieBanner.text}
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={acceptCookies}
                className="px-6 py-2 bg-brand-30 text-brand-10 text-sm font-bold rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand-30/20"
              >
                {t.cookieBanner.accept}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
