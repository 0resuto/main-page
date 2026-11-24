"use client";

import { useCookieConsent } from "../hooks/useCookieConsent";
import { writeConsent } from "../lib/consent";
import { clearVisitorId } from "../lib/analytics-client";
import type { PrivacyConsentLabels } from "../lib/privacy";

export default function PrivacyConsentControls({
  labels,
}: {
  labels: PrivacyConsentLabels;
}) {
  const consent = useCookieConsent();

  const status =
    consent === "accepted"
      ? labels.accepted
      : consent === "rejected"
        ? labels.rejected
        : labels.undecided;

  const accept = () => {
    writeConsent("accepted");
  };

  const reject = () => {
    writeConsent("rejected");
    clearVisitorId();
  };

  return (
    <section
      aria-labelledby="privacy-consent-title"
      className="my-8 rounded-2xl border border-brand-10/10 bg-brand-60/30 p-5"
    >
      <h2 id="privacy-consent-title" className="text-xl font-bold tracking-tight">
        {labels.title}
      </h2>
      <p role="status" aria-live="polite" className="mt-2 text-sm text-brand-10/70">
        {status}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={accept}
          className="rounded-xl bg-brand-30 px-4 py-2 text-sm font-bold text-brand-10 transition-transform hover:scale-105 active:scale-95"
        >
          {labels.accept}
        </button>
        <button
          type="button"
          onClick={reject}
          className="rounded-xl border border-brand-10/20 px-4 py-2 text-sm font-bold text-brand-10/80 transition-colors hover:border-brand-10/40 hover:text-brand-10"
        >
          {labels.reject}
        </button>
      </div>
    </section>
  );
}
