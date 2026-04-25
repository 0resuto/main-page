import { headers } from "next/headers";
import CookieBanner from "../components/CookieBanner";
import GitHubProfile from "../components/GitHubProfile";
import Hero from "../components/Hero";
import MusicPlayer from "../components/MusicPlayer";
import { normalizeLocale } from "./i18n";

export default async function App() {
  const locale = normalizeLocale((await headers()).get("accept-language"));

  const config = {
    GITHUB_USERNAME: process.env.NEXT_PUBLIC_GITHUB_USERNAME || "0resuto",
  };

  return (
    <main className="flex-grow">
      <Hero />

      <section
        className="pt-12 pb-12 px-6 md:px-12 bg-brand-bg text-brand-10 scroll-mt-[58px]"
        id="github"
      >
        <div className="max-w-7xl mx-auto">
          <GitHubProfile username={config.GITHUB_USERNAME} locale={locale} />
        </div>
      </section>

      <section
        className="pb-12 px-6 md:px-12 bg-brand-bg text-brand-10 scroll-mt-[88px]"
        id="music"
      >
        <div className="max-w-7xl mx-auto">
          <MusicPlayer />
        </div>
      </section>

      <CookieBanner />
    </main>
  );
}
