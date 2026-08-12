import { NextRequest, NextResponse } from "next/server";

interface SubsonicTrack {
  id: string;
  title: string;
  artist?: string;
  album?: string;
  duration?: number;
  coverArt?: string;
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

function pickProxyResponseHeaders(source: Headers) {
  const headers = new Headers();

  for (const headerName of SAFE_PROXY_RESPONSE_HEADERS) {
    const value = source.get(headerName);
    if (value) {
      headers.set(headerName, value);
    }
  }

  return headers;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get("action");
  const id = searchParams.get("id");

  const serverUrl = process.env.NAVIDROME_URL;
  const user = process.env.NAVIDROME_USER;
  const token = process.env.NAVIDROME_TOKEN;
  const salt = process.env.NAVIDROME_SALT;
  const playlistId = process.env.NAVIDROME_PLAYLIST_ID;

  if (!serverUrl || !user || !token || !salt || !playlistId) {
    return NextResponse.json({ error: "Missing Navidrome server settings" }, { status: 500 });
  }

  const authQuery = `?u=${user}&t=${token}&s=${salt}&v=1.16.1&c=0resuto&f=json`;

  try {
    if (action === "playlist") {
      const res = await fetch(`${serverUrl}/rest/getPlaylist${authQuery}&id=${playlistId}`);
      
      // Crash protection if remote Navidrome server is unavailable and returns an HTML error page
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        return NextResponse.json({ error: "Navidrome returned invalid data format (check NAVIDROME_URL settings in .env)" }, { status: 502 });
      }

      const data = await res.json();
      const subsonicRes = data["subsonic-response"];
      if (subsonicRes.status === "failed") {
        return NextResponse.json({ error: subsonicRes.error?.message }, { status: 400 });
      }

      const entries = subsonicRes.playlist?.entry || [];
      
      // Create safe URLs that point to this proxy route, not the real server
      const tracks = entries.map((track: SubsonicTrack) => ({
        id: track.id,
        title: track.title,
        artist: track.artist || "Unknown Artist",
        album: track.album || "Unknown Album",
        duration: track.duration || 0,
        streamUrl: `/api/navidrome?action=stream&id=${track.id}`,
        coverUrl: `/api/navidrome?action=cover&id=${track.coverArt || track.id}`
      }));

      return NextResponse.json(tracks);
    } 
    
    if (action === "stream" || action === "cover") {
      const endpoint = action === "stream" ? "stream" : "getCoverArt";
      const sizeParam = action === "cover" ? "&size=300" : "";
      
      const res = await fetch(`${serverUrl}/rest/${endpoint}${authQuery}&id=${id}${sizeParam}`);
      
      // Forward only the headers that the browser actually needs for media/image response.
      const headers = pickProxyResponseHeaders(res.headers);

      return new NextResponse(res.body, { status: res.status, headers });
    }
  } catch {
    return NextResponse.json({ error: "Navidrome proxy error" }, { status: 500 });
  }
}
