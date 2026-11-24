import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { normalizeLocale } from "../../lib/i18n";
import { privacyContent } from "../../lib/privacy";
import PrivacyConsentControls from "../../components/PrivacyConsentControls";

export async function generateMetadata(): Promise<Metadata> {
  const locale = normalizeLocale((await headers()).get("accept-language"));
  const content = privacyContent[locale];

  return {
    title: content.title,
    description: content.intro,
  };
}

export default async function PrivacyPage() {
  const locale = normalizeLocale((await headers()).get("accept-language"));
  const content = privacyContent[locale];
  const email = process.env.NEXT_PUBLIC_EMAIL;
  const githubUsername = process.env.NEXT_PUBLIC_GITHUB_USERNAME || "0resuto";
  const githubUrl = `https://github.com/${githubUsername}`;

  return (
    <main className="flex-grow bg-brand-bg px-6 pb-16 pt-24 text-brand-10 md:px-12">
      <article className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="text-sm font-semibold text-brand-10/70 underline underline-offset-4 transition-colors hover:text-brand-30"
        >
          ← {content.back}
        </Link>

        <h1 className="mt-6 text-4xl font-extrabold tracking-tighter md:text-5xl">
          {content.title}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-brand-10/70">{content.intro}</p>
        <p className="mt-2 text-sm text-brand-10/50">
          {content.updatedLabel}: <time dateTime={content.updated}>{content.updated}</time>
        </p>

        <PrivacyConsentControls labels={content.consent} />

        {content.sections.map((section) => (
          <section key={section.title} className="mt-8">
            <h2 className="text-2xl font-bold tracking-tight">{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="mt-3 leading-relaxed text-brand-10/70">
                {paragraph}
              </p>
            ))}
            {section.bullets && (
              <ul className="mt-3 list-disc space-y-2 pl-6 text-brand-10/70">
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <section className="mt-8">
          <h2 className="text-2xl font-bold tracking-tight">{content.contactTitle}</h2>
          <p className="mt-3 leading-relaxed text-brand-10/70">{content.contactText}</p>
          <p className="mt-3">
            {email ? (
              <a
                href={`mailto:${email}`}
                className="font-semibold text-brand-30 underline underline-offset-4"
              >
                {email}
              </a>
            ) : (
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-brand-30 underline underline-offset-4"
              >
                GitHub
              </a>
            )}
          </p>
        </section>
      </article>
    </main>
  );
}
