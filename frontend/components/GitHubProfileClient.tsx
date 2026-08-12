"use client";

import { motion } from "motion/react";
import { Github, Star } from "lucide-react";
import { Locale, translations } from "../lib/i18n";
import { GitHubProfileData, GitHubRepoData } from "../lib/github";

export default function GitHubProfileClient({
  locale,
  profile,
  repos,
  error,
}: {
  locale: Locale;
  profile: GitHubProfileData | null;
  repos: GitHubRepoData[];
  error: string | null;
}) {
  const t = translations[locale].github;

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-5xl mx-auto w-full text-center"
      >
        <div className="inline-block relative isolate rounded-3xl shadow-md overflow-hidden antialiased border border-brand-10/10 bg-brand-60/20 backdrop-blur-md px-8 py-6">
          <p className="text-brand-10/70 font-medium flex items-center gap-3">
            <Github size={24} className="text-brand-30" />
            {error}
          </p>
        </div>
      </motion.div>
    );
  }

  if (!profile) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="max-w-5xl mx-auto w-full"
    >
      <div className="relative group isolate rounded-3xl shadow-md hover:shadow-2xl overflow-hidden antialiased transform-gpu will-change-transform hover:-translate-y-2 transition-all duration-300">
        <div className="absolute inset-0 glass backdrop-blur-md bg-brand-60/30 transition-colors duration-300 pointer-events-none border border-brand-10/10 rounded-3xl group-hover:border-brand-30/30 group-hover:bg-brand-60/40"></div>

        <div className="relative z-10 p-8 md:p-10">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <a
              href={profile.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 relative block group/avatar cursor-pointer"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={profile.avatar_url}
                alt={profile.login}
                className="w-28 h-28 md:w-36 md:h-36 rounded-full border-2 border-brand-10/20 group-hover/avatar:border-brand-30/50 transition-colors object-cover bg-brand-bg"
              />
              <div className="absolute -bottom-2 -right-2 bg-brand-60 p-3 rounded-full border border-brand-10/10 text-brand-30 shadow-lg group-hover/avatar:scale-110 transition-transform">
                <Github size={24} />
              </div>
            </a>

            <div className="flex-1 text-center md:text-left flex flex-col justify-center">
              <a
                href={profile.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block w-fit mx-auto md:mx-0"
              >
                <h3 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-brand-10 mb-2 hover:text-brand-30 transition-colors">
                  {profile.name || profile.login}
                </h3>
              </a>
              {profile.bio && (
                <p className="text-brand-10/70 font-medium max-w-xl mx-auto md:mx-0 leading-relaxed text-lg">
                  {profile.bio}
                </p>
              )}

              <div className="flex flex-wrap justify-center md:justify-start gap-8 mt-6">
                <div className="flex flex-col items-center md:items-start">
                  <span className="text-2xl font-black text-brand-10">{profile.public_repos}</span>
                  <span className="text-xs uppercase tracking-widest text-brand-10/50 font-bold mt-1">
                    {t.repositories}
                  </span>
                </div>
                <div className="flex flex-col items-center md:items-start">
                  <span className="text-2xl font-black text-brand-10">{profile.followers}</span>
                  <span className="text-xs uppercase tracking-widest text-brand-10/50 font-bold mt-1">
                    {t.followers}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {repos.length > 0 && (
            <div className="mt-10 pt-8 border-t border-brand-10/10 grid grid-cols-1 md:grid-cols-3 gap-4">
              {repos.map((repo) => (
                <a
                  key={repo.id}
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-brand-60/20 hover:bg-brand-60/60 border border-brand-10/5 hover:border-brand-30/50 transition-all duration-300 rounded-2xl p-5 flex flex-col gap-3 group/repo hover:-translate-y-1 shadow-md hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4
                      className="font-bold text-lg text-brand-10 group-hover/repo:text-brand-30 truncate"
                      title={repo.name}
                    >
                      {repo.name}
                    </h4>
                    <span className="flex items-center gap-1 text-xs font-bold text-brand-10/50 bg-brand-10/5 px-2 py-1 rounded-full shrink-0">
                      <Star size={12} className="text-brand-30" /> {repo.stargazers_count}
                    </span>
                  </div>
                  <p
                    className="text-sm text-brand-10/70 line-clamp-2 flex-1"
                    title={repo.description ?? undefined}
                  >
                    {repo.description || t.noDescription}
                  </p>
                  {repo.language && (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-brand-10/50 mt-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-brand-30"></div>
                      {repo.language}
                    </div>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
