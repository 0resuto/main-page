import GitHubProfile from "../components/GitHubProfile";
import Hero from "../components/Hero";
import MusicPlayer from "../components/MusicPlayer";
import CookieBanner from "../components/CookieBanner";

export default function App() {

  const config = {
    GITHUB_USERNAME: process.env.NEXT_PUBLIC_GITHUB_USERNAME || '0resuto'
  };

  return (
      <main className="flex-grow">
        <Hero />
        
        {/* Блок с GitHub профилем */}
        <section className="pt-12 pb-12 px-6 md:px-12 bg-brand-bg text-brand-10 scroll-mt-[58px]" id="github">
          <div className="max-w-7xl mx-auto">
            <GitHubProfile username={config.GITHUB_USERNAME} />
          </div>
        </section>

        {/* Блок музыкального плеера (Navidrome) */}
        <section className="pb-12 px-6 md:px-12 bg-brand-bg text-brand-10 scroll-mt-[88px]" id="music">
          <div className="max-w-7xl mx-auto">
            <MusicPlayer />
          </div>
        </section>

        <CookieBanner />
      </main>
  );
}