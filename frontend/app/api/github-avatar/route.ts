import { NextResponse } from "next/server";

const GITHUB_USERNAME = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;
const MAX_AVATAR_BYTES = 1024 * 1024;
const CACHE_SECONDS = 86400;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json({ error: "Missing username" }, { status: 400 });
  }

  if (!GITHUB_USERNAME.test(username)) {
    return NextResponse.json({ error: "Invalid username" }, { status: 400 });
  }

  try {
    const upstream = await fetch(
      `https://github.com/${encodeURIComponent(username)}.png?size=200`,
      {
        headers: { Accept: "image/*" },
        next: { revalidate: CACHE_SECONDS },
        signal: AbortSignal.timeout(5000),
      },
    );

    const contentType = upstream.headers.get("content-type") ?? "";
    if (!upstream.ok || !contentType.startsWith("image/")) {
      return NextResponse.json({ error: "Avatar unavailable" }, { status: 502 });
    }

    const bytes = await upstream.arrayBuffer();
    if (bytes.byteLength > MAX_AVATAR_BYTES) {
      return NextResponse.json({ error: "Avatar too large" }, { status: 502 });
    }

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(bytes.byteLength),
        "Cache-Control": `public, max-age=${CACHE_SECONDS}, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=43200`,
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Avatar unavailable" }, { status: 502 });
  }
}
