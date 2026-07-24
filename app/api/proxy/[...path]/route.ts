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

  // NOTE: the X-CompliVibe-Key (carbon ingest) header is deliberately NOT forwarded.
  // The interactive UI now records readings via the session-authenticated
  // /carbon-accounting/readings/manual endpoint, so no machine ingest key is ever
  // held in the browser or sent through this proxy. That key stays a backend-only
  // credential for external/automated ingest posted directly to the API.

  // Forward the real client IP so the backend's org IP allowlist and session/audit
  // records see the end user, not this proxy's loopback address. CF-Connecting-IP is
  // set by the Cloudflare edge and cannot be spoofed by the client (the edge rejects
  // client-supplied values), so it is the trustworthy source. We deliberately do NOT
  // forward a client-supplied X-Forwarded-For, which would be attacker-controlled.
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    headers.set("cf-connecting-ip", cfConnectingIp);
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
    // Read the body as raw bytes, NOT text(): text() decodes as UTF-8 and corrupts any
    // binary download (PDF/DOCX/OSCAL/audit-evidence exports). ArrayBuffer round-trips
    // JSON, text, AND binary byte-for-byte. (Mirrors the request-side arrayBuffer fix.)
    const buf = await response.arrayBuffer();
    // Forward the upstream headers so downloads keep their Content-Type AND
    // Content-Disposition (filename) -- the old code rebuilt headers from scratch and
    // dropped everything except content-type. Skip:
    //  - set-cookie: re-added below via getSetCookie() (a plain copy comma-joins them,
    //    and Expires dates contain commas);
    //  - content-encoding/content-length/transfer-encoding: fetch already DECODED the
    //    body, so these are now stale and would corrupt it / mislead the client.
    const STRIP = new Set([
      "set-cookie",
      "content-encoding",
      "content-length",
      "transfer-encoding",
      "connection"
    ]);
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      if (!STRIP.has(key.toLowerCase())) responseHeaders.set(key, value);
    });
    if (!responseHeaders.has("content-type")) {
      responseHeaders.set("content-type", "application/json");
    }
    const setCookies = response.headers.getSetCookie?.() ?? [];
    for (const cookieValue of setCookies) {
      responseHeaders.append("set-cookie", cookieValue);
    }
    // 204 No Content / 205 Reset Content / 304 Not Modified are "null body status"
    // codes: the Response/NextResponse constructor throws if given ANY body (even an
    // empty buffer), which the bare catch below then masks as a generic 502. Delete and
    // other no-content-success endpoints legitimately return 204, so pass a null body
    // (never `buf`) for these statuses while still forwarding headers/cookies.
    const isNullBodyStatus =
      response.status === 204 || response.status === 205 || response.status === 304;
    return new NextResponse(isNullBodyStatus ? null : buf, {
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
