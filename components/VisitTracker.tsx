"use client";

import { useEffect } from "react";
import { getOrCreateVisitorId, trackVisit } from "../app/analytics-client";

export default function VisitTracker() {
  useEffect(() => {
    const visitorId = getOrCreateVisitorId();
    const pageLoadMarker = Math.round(window.performance.timeOrigin);
    const eventId = `visit:${visitorId}:${pageLoadMarker}:${window.location.pathname}`;

    trackVisit({
      eventId,
      visitorId,
      path: window.location.pathname,
    }).catch((error) => {
      console.error("Failed to track visit:", error);
    });
  }, []);

  return null;
}
