import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.adarshkumar.app";

async function handler(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolved = await params;
  const targetUrl = `${API_BASE_URL}/${resolved.path.join("/")}${request.nextUrl.search}`;
  const headers = new Headers();
  const auth = request.headers.get("authorization");
  const contentType = request.headers.get("content-type");
  const orgId = request.headers.get("x-organization-id");
  // The session lives in an httpOnly cookie set by the backend; forward it through so the
  // backend can authenticate the browser's request, and forward the CSRF header the client
  // attaches on mutations (double-submit against the cookie).
  const cookie = request.headers.get("cookie");
  const csrfToken = request.headers.get("x-csrf-token");

  if (auth) {
    headers.set("authorization", auth);
  }
  if (contentType) {
    headers.set("content-type", contentType);
  }
  if (orgId) {
    headers.set("x-organization-id", orgId);
  }
  if (cookie) {
    headers.set("cookie", cookie);
  }
  if (csrfToken) {
    headers.set("x-csrf-token", csrfToken);
  }

  // Carbon-accounting ingest authenticates via this key instead of the bearer token
  // (POST /api/v1/carbon-accounting/readings).
  const carbonKey = request.headers.get("x-complivibe-key");
  if (carbonKey) {
    headers.set("x-complivibe-key", carbonKey);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store"
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    // Read as an ArrayBuffer, not text(): text() corrupts binary/multipart bodies
    // (real file uploads via multipart/form-data). ArrayBuffer preserves the exact
    // bytes for both JSON and multipart, and the forwarded content-type header keeps
    // the multipart boundary intact.
    init.body = await request.arrayBuffer();
  }

  try {
    const response = await fetch(targetUrl, init);
    const text = await response.text();
    const responseHeaders = new Headers({
      "content-type": response.headers.get("content-type") || "application/json"
    });
    // response.headers.get("set-cookie") would incorrectly comma-join multiple cookies
    // (Expires dates themselves contain commas); getSetCookie() preserves each one.
    const setCookies = response.headers.getSetCookie?.() ?? [];
    for (const cookieValue of setCookies) {
      responseHeaders.append("set-cookie", cookieValue);
    }
    return new NextResponse(text, {
      status: response.status,
      headers: responseHeaders
    });
  } catch {
    return NextResponse.json({ message: "Proxy request failed" }, { status: 502 });
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
