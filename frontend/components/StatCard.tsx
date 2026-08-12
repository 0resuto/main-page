"use client";

import { motion } from "motion/react";
import { LucideIcon } from "lucide-react";

const StatCard = ({ value, label, index, icon: Icon, imageUrl, url }: { value: string; label: string; index: number; icon: LucideIcon; imageUrl: string; url?: string }) => {
  const content = (
    <>
      <div className={`absolute inset-0 glass backdrop-blur-md bg-brand-60/30 transition-colors duration-300 pointer-events-none rounded-2xl border border-brand-10/10 ${url ? 'group-hover:border-brand-30/50 group-hover:bg-brand-60/50' : ''}`}></div>
      <div className="relative z-10 p-4 lg:p-8 flex-1 flex flex-row lg:flex-col items-center lg:items-start gap-4 lg:gap-0">
        <Icon size={32} className="text-brand-30 lg:mb-4 shrink-0" />
        <div>
          <div className="text-2xl lg:text-4xl font-extrabold tracking-tighter text-brand-10 mb-1 lg:mb-2">{value}</div>
          <div className="text-xs lg:text-sm font-medium text-brand-10/80 uppercase tracking-wider">{label}</div>
        </div>
      </div>
      <div className="relative z-10 w-1/6 lg:w-1/4 m-4 lg:m-8 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={label} className="max-w-full max-h-full object-contain" />
      </div>
    </>
  );

  const baseClasses = "rounded-2xl shadow-md flex overflow-hidden relative group z-0";

  if (url) {
    return (
      <motion.a 
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1, duration: 0.5 }}
        className={`${baseClasses} hover:-translate-y-2 hover:shadow-2xl hover:z-10 transition-all duration-300 cursor-pointer antialiased`}
      >
        {content}
      </motion.a>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className={baseClasses}
    >
      {content}
    </motion.div>
  );
};

export default StatCard;