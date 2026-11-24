import { hasAnalyticsConsent } from "./consent";

export interface SiteStats {
  total_visits: number;
  unique_visitors: number;
  listened_tracks: number;
}

const ANALYTICS_API_BASE = "/api/analytics";
const VISITOR_COOKIE_NAME = "site_visitor_id";
const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 90;

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

  const secure = window.location.protocol === "https:" ? "; Secure" : "";

  document.cookie = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    `Max-Age=${maxAge}`,
    "SameSite=Lax",
  ].join("; ") + secure;
}

export function clearVisitorId() {
  if (typeof document === "undefined") return;

  document.cookie = `${VISITOR_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function createVisitorId() {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function getOrCreateVisitorId(): string | null {
  if (!hasAnalyticsConsent()) {
    return null;
  }

  const existingVisitorId = readCookie(VISITOR_COOKIE_NAME);
  if (existingVisitorId) {
    return existingVisitorId;
  }

  const visitorId = createVisitorId();
  writeCookie(VISITOR_COOKIE_NAME, visitorId, VISITOR_COOKIE_MAX_AGE);
  return visitorId;
}

export async function trackVisit(visit: {
  idempotencyKey: string;
  visitorId: string;
  path: string;
}) {
  if (!hasAnalyticsConsent()) return;

  await fetch(`${ANALYTICS_API_BASE}/visits`, {
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
  if (!hasAnalyticsConsent()) return;

  await fetch(`${ANALYTICS_API_BASE}/track-listens`, {
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
  const response = await fetch(`${ANALYTICS_API_BASE}/stats`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch analytics stats: ${response.status}`);
  }

  return (await response.json()) as SiteStats;
}

export interface MetricHistoryItem {
  date: string;
  count: number;
}

export interface StatsHistoryOut {
  visits: MetricHistoryItem[];
  unique_visitors: MetricHistoryItem[];
  listened_tracks: MetricHistoryItem[];
}

export async function fetchStatsHistory() {
  const response = await fetch(`${ANALYTICS_API_BASE}/stats-history`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch stats history: ${response.status}`);
  }

  return (await response.json()) as StatsHistoryOut;
}
