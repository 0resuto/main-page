"use client";

import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { useLanguage } from "../LanguageProvider";

const PrivacyModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const { t } = useLanguage();

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-brand-60 border border-brand-10/10 rounded-3xl p-8 w-full max-w-2xl max-h-[80vh] overflow-y-auto relative text-left shadow-2xl text-brand-10"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 bg-brand-bg/50 rounded-full hover:bg-brand-bg transition-colors text-brand-10"
            >
              <X size={20} />
            </button>
            <h2 className="text-3xl font-bold tracking-tight mb-6">{t.privacyModal.title}</h2>
            <div className="space-y-4 text-sm text-brand-10/70 leading-relaxed">
              <p>{t.privacyModal.placeholder}</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PrivacyModal;
