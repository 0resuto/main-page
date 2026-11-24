import { NextRequest, NextResponse } from "next/server";

const ALLOWED_METHODS: Record<string, "GET" | "POST"> = {
  visits: "POST",
  "track-listens": "POST",
  stats: "GET",
  "stats-history": "GET",
};

function getAnalyticsBaseUrl() {
  const value = process.env.ANALYTICS_API_URL?.trim();
  return value ? value.replace(/\/$/, "") : null;
}

async function proxyToAnalytics(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;

  if (path.length !== 1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const endpoint = path[0];
  const expectedMethod = ALLOWED_METHODS[endpoint];

  if (!expectedMethod) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (request.method !== expectedMethod) {
    return NextResponse.json(
      { error: "Method not allowed" },
      { status: 405, headers: { Allow: expectedMethod } },
    );
  }

  const baseUrl = getAnalyticsBaseUrl();
  if (!baseUrl) {
    return NextResponse.json(
      { error: "Analytics is not configured" },
      { status: 503 },
    );
  }

  const headers = new Headers({ Accept: "application/json" });
  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  const clientIp =
    request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip");
  if (clientIp) {
    headers.set("X-Forwarded-For", clientIp);
  }

  const body = expectedMethod === "POST" ? await request.text() : undefined;

  try {
    const upstream = await fetch(`${baseUrl}/analytics/${endpoint}`, {
      method: expectedMethod,
      headers,
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });

    const upstreamType = upstream.headers.get("content-type") ?? "";
    if (!upstreamType.includes("application/json")) {
      return NextResponse.json(
        { error: "Analytics unavailable" },
        { status: 502 },
      );
    }

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": upstreamType,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Analytics unavailable" },
      { status: 502 },
    );
  }
}

export const GET = proxyToAnalytics;
export const POST = proxyToAnalytics;
