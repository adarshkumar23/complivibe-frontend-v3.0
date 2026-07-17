// Shared API helpers for the RBAC mutation-matrix specs (direct-API 403 + policy
// approval quorum). Uses bearer-token auth (the backend accepts Authorization:
// Bearer in addition to the httpOnly cookie), which sidesteps CSRF for these
// server-side authorization probes. The UI mutation specs still exercise the real
// cookie/CSRF path through the browser.
import type { APIRequestContext } from "playwright/test";
import { BASE_API, ORG_ID, PW, PERSONAS } from "./routes";

export type Session = { token: string; uid: string; headers: Record<string, string> };

function decodeSub(jwt: string): string {
  let p = jwt.split(".")[1];
  p += "=".repeat((4 - (p.length % 4)) % 4);
  const json = JSON.parse(Buffer.from(p, "base64url").toString("utf8"));
  return String(json.sub);
}

export async function apiLogin(request: APIRequestContext, email: string): Promise<Session> {
  const res = await request.post(`${BASE_API}/api/v1/auth/login`, { data: { email, password: PW } });
  if (!res.ok()) throw new Error(`login failed for ${email}: ${res.status()} ${await res.text()}`);
  const token = (await res.json()).access_token as string;
  return {
    token,
    uid: decodeSub(token),
    headers: { Authorization: `Bearer ${token}`, "X-Organization-ID": ORG_ID },
  };
}

export function emailForPersona(key: string): string {
  const p = PERSONAS.find((x) => x.key === key);
  if (!p) throw new Error(`unknown persona ${key}`);
  return p.email;
}

// Write authority per the LIVE 0307 catalog (queried from complivibe_loadtest):
// controls:write / compliance_policies:write / vendors:write are all held by
// exactly {admin, compliance_manager}. Reviewer(x2)/auditor/readonly hold none.
export const CAN_WRITE = new Set(["admin", "compliance_manager"]);
