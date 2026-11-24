"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Info } from "lucide-react";
import { useLanguage } from "./LanguageProvider";
import { useCookieConsent } from "../hooks/useCookieConsent";
import { writeConsent } from "../lib/consent";
import { clearVisitorId } from "../lib/analytics-client";

const subscribeHydration = () => () => {};
const getHydrated = () => true;
const getServerHydrated = () => false;

export default function CookieBanner() {
  const consent = useCookieConsent();
  const hydrated = useSyncExternalStore(subscribeHydration, getHydrated, getServerHydrated);
  const { t } = useLanguage();

  const acceptCookies = () => {
    writeConsent("accepted");
  };

  const rejectCookies = () => {
    writeConsent("rejected");
    clearVisitorId();
  };

  return (
    <AnimatePresence>
      {hydrated && consent === null && (
        <motion.div
          role="region"
          aria-label={t.cookieBanner.label}
          aria-live="polite"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.35 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-[440px] z-[100] isolate rounded-2xl shadow-2xl overflow-hidden antialiased"
        >
          <div className="absolute inset-0 glass backdrop-blur-xl bg-brand-60/80 border border-brand-10/10 rounded-2xl pointer-events-none"></div>
          <div className="relative z-10 p-4 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <Info size={22} className="text-brand-30 shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-brand-10/80 leading-relaxed">
                {t.cookieBanner.text}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link
                href="/privacy"
                className="text-sm font-semibold text-brand-10/70 underline underline-offset-4 hover:text-brand-30 transition-colors"
              >
                {t.cookieBanner.privacy}
              </Link>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={rejectCookies}
                  className="px-4 py-2 text-sm font-bold rounded-xl border border-brand-10/20 text-brand-10/80 hover:border-brand-10/40 hover:text-brand-10 transition-colors"
                >
                  {t.cookieBanner.reject}
                </button>
                <button
                  type="button"
                  onClick={acceptCookies}
                  className="px-5 py-2 bg-brand-30 text-brand-10 text-sm font-bold rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand-30/20"
                >
                  {t.cookieBanner.accept}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
