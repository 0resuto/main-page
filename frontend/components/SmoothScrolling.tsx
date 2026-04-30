"use client";

import { useEffect } from "react";
import Lenis from "lenis";

export default function SmoothScrolling({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 0.8, // Длительность инерции
      easing: (t) => Math.min(1, 1 - Math.pow(1 - t, 3) + t * 0.005), // Убираем долгий хвост (эффект примагничивания)
      smoothWheel: true,
      wheelMultiplier: 1.0, // Увеличивает или уменьшает скорость/шаг прокрутки
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    const handleHashClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (anchor) {
        const href = anchor.getAttribute("href");
        if (href?.startsWith("#") && href.length > 1) {
          e.preventDefault();
          lenis.scrollTo(href);
          if (href === "#about") {
            window.history.pushState(null, "", window.location.pathname);
          } else {
            window.history.pushState(null, "", href);
          }
        }
      }
    };

    document.documentElement.addEventListener("click", handleHashClick);

    return () => {
      document.documentElement.removeEventListener("click", handleHashClick);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}