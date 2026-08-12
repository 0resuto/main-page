"use client";

import { useEffect } from "react";
import { getOrCreateVisitorId, trackVisit } from "../lib/analytics-client";

export default function VisitTracker() {
  useEffect(() => {
    const visitorId = getOrCreateVisitorId();
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
  }, []);

  return null;
}
