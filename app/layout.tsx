import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SmoothScrolling from "../components/SmoothScrolling";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { LanguageProvider } from "../components/LanguageProvider";
import { normalizeLocale, translations } from "./i18n";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = normalizeLocale((await headers()).get("accept-language"));

  return {
    title: "Mark Yarovikov",
    description: translations[locale].metadataDescription,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = normalizeLocale((await headers()).get("accept-language"));

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-screen flex flex-col">
        <LanguageProvider initialLocale={locale}>
          <SmoothScrolling>
            <Header />
            {children}
            <Footer />
          </SmoothScrolling>
        </LanguageProvider>
      </body>
    </html>
  );
}
