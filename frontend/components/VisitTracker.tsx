"use client";

import { useEffect, useRef } from "react";
import { getOrCreateVisitorId, trackVisit } from "../lib/analytics-client";
import { useCookieConsent } from "../hooks/useCookieConsent";

export default function VisitTracker() {
  const consent = useCookieConsent();
  const tracked = useRef(false);

  useEffect(() => {
    if (consent !== "accepted" || tracked.current) {
      return;
    }

    const visitorId = getOrCreateVisitorId();
    if (!visitorId) {
      return;
    }

    tracked.current = true;
    const pageLoadMarker = Math.round(window.performance.timeOrigin);
    // The deterministic ID acts as an idempotency key to prevent duplicates
    // during React Strict Mode double-mounts and network retries.
    const idempotencyKey = `visit:${visitorId}:${pageLoadMarker}:${window.location.pathname}`;

    trackVisit({
      idempotencyKey,
      visitorId,
      path: window.location.pathname,
    }).catch((error) => {
      console.error("Failed to track visit:", error);
    });
  }, [consent]);

  return null;
}
