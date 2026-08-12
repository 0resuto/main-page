export interface SiteStats {
  total_visits: number;
  unique_visitors: number;
  listened_tracks: number;
}

const DEFAULT_ANALYTICS_API_URL = "http://127.0.0.1:8000";
const VISITOR_COOKIE_NAME = "site_visitor_id";
const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function getAnalyticsApiUrl() {
  return process.env.NEXT_PUBLIC_ANALYTICS_API_URL || DEFAULT_ANALYTICS_API_URL;
}

function readCookie(name: string) {
  if (typeof document === "undefined") return null;

  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${escapedName}=([^;]*)`),
  );

  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string, maxAge: number) {
  if (typeof document === "undefined") return;

  document.cookie = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    `Max-Age=${maxAge}`,
    "SameSite=Lax",
  ].join("; ");
}

export function getOrCreateVisitorId() {
  const existingVisitorId = readCookie(VISITOR_COOKIE_NAME);
  if (existingVisitorId) {
    return existingVisitorId;
  }

  const visitorId = crypto.randomUUID();
  writeCookie(VISITOR_COOKIE_NAME, visitorId, VISITOR_COOKIE_MAX_AGE);
  return visitorId;
}

export async function trackVisit(visit: {
  idempotencyKey: string;
  visitorId: string;
  path: string;
}) {
  await fetch(`${getAnalyticsApiUrl()}/analytics/visits`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      idempotency_key: visit.idempotencyKey,
      visitor_id: visit.visitorId,
      path: visit.path,
    }),
  });
}

export async function trackListenedTrack(event: {
  idempotencyKey: string;
  visitorId: string;
  trackId: string;
  trackTitle: string;
  listenedSeconds: number;
}) {
  await fetch(`${getAnalyticsApiUrl()}/analytics/track-listens`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      idempotency_key: event.idempotencyKey,
      visitor_id: event.visitorId,
      track_id: event.trackId,
      track_title: event.trackTitle,
      listened_seconds: Math.floor(event.listenedSeconds),
    }),
  });
}

export async function fetchSiteStats() {
  const response = await fetch(`${getAnalyticsApiUrl()}/analytics/stats`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch analytics stats: ${response.status}`);
  }

  return (await response.json()) as SiteStats;
}
