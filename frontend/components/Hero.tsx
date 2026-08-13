"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { Cloud, Music, Film, CarFront } from "lucide-react";
import StatCard from "./StatCard";
import { useLanguage } from "./LanguageProvider";

export default function Hero() {
  const { t } = useLanguage();
  const { scrollY } = useScroll();
  const backgroundY = useTransform(scrollY, (y: number) => y * 0.7);
  const textY = useTransform(scrollY, (y: number) => y * 0.5);
  const cardsY = useTransform(scrollY, (y: number) => y * 0.1);
  const textOpacity = useTransform(scrollY, [0, 500], [1, 0]);

  return (
    <section
      className="relative min-h-screen flex flex-col justify-center px-6 md:px-12 overflow-hidden pt-24 pb-24 md:pb-34"
      id="about"
    >
      <motion.div className="absolute inset-0 w-full h-full z-0" style={{ y: backgroundY }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="w-full h-full object-cover"
          src="/images/hero-bg.webp"
          alt="Custom Bike Frame"
        />
        <div className="absolute inset-0 bg-black/30"></div>
      </motion.div>

      <div className="relative z-10 max-w-7xl mx-auto w-full flex-grow flex flex-col justify-center">
        <motion.div style={{ y: textY, opacity: textOpacity }}>
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <h1 className="text-5xl md:text-7xl font-extrabold text-brand-10 tracking-tighter leading-[0.95] mb-6">
              {t.hero.title}
            </h1>
            <p className="text-xl text-brand-10/90 font-medium mb-4 max-w-xl leading-relaxed">
              {t.hero.description}
            </p>
          </motion.div>
        </motion.div>
      </div>

      <motion.div className="relative z-10 max-w-7xl mx-auto w-full mt-8" style={{ y: cardsY }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            value={t.hero.cards.racing}
            label="Cold Mirror"
            index={0}
            icon={CarFront}
            imageUrl="/images/logo/iracing-logo.webp"
            url="https://racing.markyarovikov.ru"
          />
          <StatCard
            value={t.hero.cards.cloud}
            label="Nextcloud"
            index={1}
            icon={Cloud}
            imageUrl="/images/logo/nextcloud-logo.webp"
            url="https://cloud.markyarovikov.ru"
          />
          <StatCard
            value={t.hero.cards.music}
            label="Navidrome"
            index={2}
            icon={Music}
            imageUrl="/images/logo/navidrome-logo.webp"
            url="https://music.markyarovikov.ru"
          />
          <StatCard
            value={t.hero.cards.films}
            label="Wekan"
            index={3}
            icon={Film}
            imageUrl="/images/logo/wekan-logo.webp"
            url="https://films.markyarovikov.ru"
          />
        </div>
      </motion.div>
    </section>
  );
}
