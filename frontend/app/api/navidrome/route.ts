import { NextRequest, NextResponse } from "next/server";

interface SubsonicTrack {
  id: string;
  title: string;
  artist?: string;
  album?: string;
  duration?: number;
  coverArt?: string;
}

interface NavidromeTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  streamUrl: string;
  coverUrl: string;
}

interface PlaylistCache {
  tracks: NavidromeTrack[];
  trackIds: Set<string>;
  coverIds: Set<string>;
  expiresAt: number;
}

interface SubsonicResponse {
  "subsonic-response"?: {
    status?: string;
    playlist?: { entry?: SubsonicTrack[] };
  };
}

const SAFE_PROXY_RESPONSE_HEADERS = [
  "accept-ranges",
  "cache-control",
  "content-length",
  "content-range",
  "content-type",
  "etag",
  "last-modified",
] as const;

const PLAYLIST_CACHE_TTL_MS = 60_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 120;
const MAX_ID_LENGTH = 256;

let playlistCache: PlaylistCache | null = null;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function pickProxyResponseHeaders(source: Headers) {
  const headers = new Headers();

  for (const headerName of SAFE_PROXY_RESPONSE_HEADERS) {
    const value = source.get(headerName);
    if (value) {
      headers.set(headerName, value);
    }
  }

  headers.set("X-Content-Type-Options", "nosniff");
  return headers;
}

function getConfig() {
  const rawServerUrl = process.env.NAVIDROME_URL;
  const user = process.env.NAVIDROME_USER;
  const token = process.env.NAVIDROME_TOKEN;
  const salt = process.env.NAVIDROME_SALT;
  const playlistId = process.env.NAVIDROME_PLAYLIST_ID;

  if (!rawServerUrl || !user || !token || !salt || !playlistId) {
    return null;
  }

  let serverUrl: URL;
  try {
    serverUrl = new URL(rawServerUrl);
  } catch {
    return null;
  }

  const isLocal = serverUrl.hostname === "localhost" || serverUrl.hostname === "127.0.0.1";
  if (serverUrl.protocol !== "https:" && !isLocal) {
    return null;
  }

  return {
    serverUrl: serverUrl.toString().replace(/\/$/, ""),
    user,
    token,
    salt,
    playlistId,
  };
}

function buildAuthQuery(config: NonNullable<ReturnType<typeof getConfig>>) {
  return [
    `u=${encodeURIComponent(config.user)}`,
    `t=${encodeURIComponent(config.token)}`,
    `s=${encodeURIComponent(config.salt)}`,
    "v=1.16.1",
    "c=0resuto",
    "f=json",
  ].join("&");
}

function getClientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

function isRateLimited(request: Request) {
  const now = Date.now();
  const key = getClientKey(request);
  const bucket = rateBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  bucket.count += 1;
  return bucket.count > RATE_LIMIT_MAX;
}

async function loadPlaylist(config: NonNullable<ReturnType<typeof getConfig>>) {
  if (playlistCache && playlistCache.expiresAt > Date.now()) {
    return playlistCache;
  }

  const upstream = await fetch(
    `${config.serverUrl}/rest/getPlaylist?${buildAuthQuery(config)}&id=${encodeURIComponent(config.playlistId)}`,
    {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    },
  );

  const contentType = upstream.headers.get("content-type") ?? "";
  if (!upstream.ok || !contentType.includes("application/json")) {
    throw new Error("Navidrome playlist unavailable");
  }

  const data = (await upstream.json()) as SubsonicResponse;
  const response = data["subsonic-response"];
  if (!response || response.status === "failed") {
    throw new Error("Navidrome playlist rejected");
  }

  const entries = Array.isArray(response?.playlist?.entry)
    ? response.playlist.entry
    : [];

  const tracks: NavidromeTrack[] = entries
    .filter((track): track is SubsonicTrack => Boolean(track?.id && track?.title))
    .map((track) => ({
      id: track.id,
      title: track.title,
      artist: track.artist || "Unknown Artist",
      album: track.album || "Unknown Album",
      duration: track.duration || 0,
      streamUrl: `/api/navidrome?action=stream&id=${encodeURIComponent(track.id)}`,
      coverUrl: `/api/navidrome?action=cover&id=${encodeURIComponent(track.coverArt || track.id)}`,
    }));

  const trackIds = new Set(tracks.map((track) => track.id));
  const coverIds = new Set<string>();
  for (const track of entries) {
    if (!track?.id) continue;
    coverIds.add(track.coverArt || track.id);
    coverIds.add(track.id);
  }

  playlistCache = {
    tracks,
    trackIds,
    coverIds,
    expiresAt: Date.now() + PLAYLIST_CACHE_TTL_MS,
  };

  return playlistCache;
}

export async function GET(request: NextRequest) {
  const config = getConfig();
  if (!config) {
    return NextResponse.json(
      { error: "Navidrome is not configured" },
      { status: 500 },
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get("action");
  const id = searchParams.get("id");

  try {
    if (action === "playlist") {
      const playlist = await loadPlaylist(config);
      return NextResponse.json(playlist.tracks, {
        headers: {
          "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        },
      });
    }

    if (action !== "stream" && action !== "cover") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    if (!id || id.length > MAX_ID_LENGTH) {
      return NextResponse.json({ error: "Invalid track id" }, { status: 400 });
    }

    if (isRateLimited(request)) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": "60" } },
      );
    }

    const playlist = await loadPlaylist(config);
    const allowedIds = action === "stream" ? playlist.trackIds : playlist.coverIds;
    if (!allowedIds.has(id)) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    const endpoint = action === "stream" ? "stream" : "getCoverArt";
    const sizeParam = action === "cover" ? "&size=300" : "";
    const requestHeaders = new Headers({
      Accept: action === "stream" ? "audio/*" : "image/*",
    });
    const range = request.headers.get("range");
    if (range) {
      requestHeaders.set("Range", range);
    }

    const upstream = await fetch(
      `${config.serverUrl}/rest/${endpoint}?${buildAuthQuery(config)}&id=${encodeURIComponent(id)}${sizeParam}`,
      {
        headers: requestHeaders,
        cache: "no-store",
      },
    );

    const contentType = upstream.headers.get("content-type") ?? "";
    const expectedPrefix = action === "stream" ? "audio/" : "image/";
    if (!upstream.ok || !contentType.startsWith(expectedPrefix)) {
      return NextResponse.json({ error: "Navidrome unavailable" }, { status: 502 });
    }

    const headers = pickProxyResponseHeaders(upstream.headers);
    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch {
    return NextResponse.json({ error: "Navidrome unavailable" }, { status: 502 });
  }
}
