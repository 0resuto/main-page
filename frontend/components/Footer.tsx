"use client";

import { useEffect, useState } from "react";
import { Phone, Mail } from "lucide-react";
import AnchorLink from "./AnchorLink";
import { useLanguage } from "./LanguageProvider";
import { fetchSiteStats, SiteStats, fetchStatsHistory, StatsHistoryOut } from "../lib/analytics-client";
import Sparkline from "./Sparkline";

export default function Footer() {
  const [stats, setStats] = useState<SiteStats | null>(null);
  const [history, setHistory] = useState<StatsHistoryOut | null>(null);
  const [statsError, setStatsError] = useState(false);
  const { t } = useLanguage();

  const config = {
    PHONE: process.env.NEXT_PUBLIC_PHONE,
    PHONE_LINK: process.env.NEXT_PUBLIC_PHONE_LINK,
    EMAIL: process.env.NEXT_PUBLIC_EMAIL,
  };

  useEffect(() => {
    Promise.all([fetchSiteStats(), fetchStatsHistory()])
      .then(([statsData, historyData]) => {
        setStats(statsData);
        setHistory(historyData);
        setStatsError(false);
      })
      .catch((error) => {
        console.error("Failed to fetch footer stats:", error);
        setStatsError(true);
      });
  }, []);

  return (
      <footer className="w-full py-12 px-6 md:px-12 bg-brand-bg text-brand-10 border-t border-brand-10/10">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 xl:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <div
              className="flex items-center gap-3 group cursor-pointer w-fit"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
                window.history.pushState(null, "", window.location.pathname);
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.svg"
                alt="Silent Customs"
                className="h-10 w-auto group-hover:scale-110 transition-transform duration-300"
              />
              <div className="text-2xl font-bold tracking-tighter uppercase">Mark Yarovikov</div>
            </div>
            <p className="text-brand-10/70 max-w-xs leading-relaxed">{t.footer.description}</p>
          </div>

          <div className="space-y-6">
            <h4 className="text-sm font-bold uppercase tracking-widest text-brand-10/50">
              {t.footer.navigation}
            </h4>
            <div className="flex flex-col gap-3">
              <AnchorLink className="hover:text-brand-30 transition-colors" href="#about">
                {t.nav.home}
              </AnchorLink>
              <AnchorLink className="hover:text-brand-30 transition-colors" href="#github">
                {t.nav.github}
              </AnchorLink>
              <AnchorLink className="hover:text-brand-30 transition-colors" href="#music">
                {t.nav.music}
              </AnchorLink>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-sm font-bold uppercase tracking-widest text-brand-10/50">
              {t.footer.stats}
            </h4>
            {statsError ? (
              <p className="text-brand-10/60 max-w-xs leading-relaxed">
                {t.footer.statsUnavailable}
              </p>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="text-2xl font-black text-brand-10">
                      {stats?.total_visits ?? "..."}
                    </span>
                    <span className="text-xs uppercase tracking-widest text-brand-10/50 font-bold mt-1">
                      {t.footer.totalVisits}
                    </span>
                  </div>
                  {history && (
                    <div className="flex-shrink-0">
                      <Sparkline data={history.visits} height={40} width={140} />
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="text-2xl font-black text-brand-10">
                      {stats?.unique_visitors ?? "..."}
                    </span>
                    <span className="text-xs uppercase tracking-widest text-brand-10/50 font-bold mt-1">
                      {t.footer.uniqueVisitors}
                    </span>
                  </div>
                  {history && (
                    <div className="flex-shrink-0">
                      <Sparkline data={history.unique_visitors} height={40} width={140} />
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="text-2xl font-black text-brand-10">
                      {stats?.listened_tracks ?? "..."}
                    </span>
                    <span className="text-xs uppercase tracking-widest text-brand-10/50 font-bold mt-1">
                      {t.footer.listenedTracks}
                    </span>
                  </div>
                  {history && (
                    <div className="flex-shrink-0">
                      <Sparkline data={history.listened_tracks} height={40} width={140} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {(config.PHONE || config.EMAIL) && (
            <div className="space-y-6">
              <h4 className="text-sm font-bold uppercase tracking-widest text-brand-10/50">
                {t.footer.contacts}
              </h4>
              <div className="space-y-4">
                {config.PHONE && (
                  <a
                    href={config.PHONE_LINK || `tel:${config.PHONE}`}
                    className="flex items-center gap-3 hover:text-brand-30 transition-colors"
                  >
                    <Phone size={18} className="text-brand-30" /> {config.PHONE}
                  </a>
                )}
                {config.EMAIL && (
                  <a
                    href={`mailto:${config.EMAIL}`}
                    className="flex items-center gap-3 hover:text-brand-30 transition-colors"
                  >
                    <Mail size={18} className="text-brand-30" /> {config.EMAIL}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-brand-10/10 pt-8 text-sm text-brand-10/50">
          <span>© {new Date().getFullYear()} Mark Yarovikov</span>
          <a href="/privacy" className="hover:text-brand-30 transition-colors">
            {t.footer.privacy}
          </a>
        </div>
      </footer>
  );
}
