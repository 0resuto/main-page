"use client";

import { useState, useEffect, ReactNode } from "react";
import {
  motion,
  useScroll,
  useMotionValueEvent,
  AnimatePresence,
} from "motion/react";
import { Menu, X } from "lucide-react";
import AnchorLink from "./AnchorLink";
import { useLanguage } from "./LanguageProvider";

const NavItem = ({
  href,
  children,
  onClick,
  isActive,
}: {
  href: string;
  children: ReactNode;
  onClick?: () => void;
  isActive?: boolean;
}) => {
  return (
    <AnchorLink
      href={href}
      onClick={onClick}
      className={`group transition-colors text-lg xl:text-large font-medium tracking-tight flex items-center h-full px-2 ${
        isActive ? "text-brand-30" : "text-brand-10/70 hover:text-brand-30"
      }`}
    >
      <span
        className={`relative flex items-center h-full after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-left after:transition-transform after:duration-300 after:ease-out after:bg-brand-30 ${
          isActive ? "after:scale-x-100" : "after:scale-x-0 group-hover:after:scale-x-100"
        }`}
      >
        {children}
      </span>
    </AnchorLink>
  );
};

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const { t } = useLanguage();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50);
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
            if (entry.target.id === "about") {
              window.history.replaceState(null, "", window.location.pathname);
            } else {
              window.history.replaceState(null, "", `#${entry.target.id}`);
            }
          }
        });
      },
      { rootMargin: "-40% 0px -60% 0px" },
    );

    const sections = document.querySelectorAll("section[id]");
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        isScrolled || isMenuOpen
          ? "glass backdrop-blur-md bg-brand-bg/80 shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="w-full px-6 md:px-12">
        <nav className="relative flex justify-between items-center h-16 max-w-7xl mx-auto w-full">
          <div
            className="flex items-center gap-1 group cursor-pointer"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
              window.history.pushState(null, "", window.location.pathname);
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.svg"
              alt="0resuto-logo"
              className="h-12 w-auto group-hover:scale-110 transition-transform duration-300"
            />
            <div className="text-xl font-bold tracking-tighter uppercase">
              Mark Yarovikov
            </div>
          </div>

          <div className="hidden xl:flex items-center gap-4 h-full absolute left-1/2 -translate-x-1/2">
            <NavItem href="#about" isActive={activeSection === "about"}>
              {t.nav.home}
            </NavItem>
            <NavItem href="#github" isActive={activeSection === "github"}>
              {t.nav.github}
            </NavItem>
            <NavItem href="#music" isActive={activeSection === "music"}>
              {t.nav.music}
            </NavItem>
          </div>

          <div className="flex items-center gap-2 h-full">
            <button
              className="xl:hidden px-3 h-full flex items-center justify-center -mr-3"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </nav>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="xl:hidden p-10 flex flex-col gap-8 shadow-2xl"
          >
            <NavItem
              href="#about"
              onClick={() => setIsMenuOpen(false)}
              isActive={activeSection === "about"}
            >
              {t.nav.home}
            </NavItem>
            <NavItem
              href="#github"
              onClick={() => setIsMenuOpen(false)}
              isActive={activeSection === "github"}
            >
              {t.nav.github}
            </NavItem>
            <NavItem
              href="#music"
              onClick={() => setIsMenuOpen(false)}
              isActive={activeSection === "music"}
            >
              {t.nav.music}
            </NavItem>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
