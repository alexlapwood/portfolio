// The contact form's SolidStart server action — the one place the pieces meet on
// the server. It reads the submitted FormData, feeds the per-IP rate-limit state
// to deliverContact, and returns the { ok, text } result to the client. All the
// decision + email logic lives in the pure, tested modules it calls; this file
// is just the request-shaped glue (env, FormData, IP, the in-memory store).

import { action } from "@solidjs/router";
import { getRequestEvent } from "solid-js/web";
import { contactConfigFromEnv, deliverContact } from "~/lib/contact";
import { RATE_LIMIT } from "~/lib/contactSubmission";
import { createResendTransport } from "~/lib/resendTransport";

// Best-effort, in-memory per-IP send history. NOTE: serverless instances don't
// share memory — each cold start / concurrent lambda gets its own Map — so this
// is spam friction stacked on top of the honeypot, not a hard global cap
// (matching the PRD's "honeypot + rate-limit" intent). A durable limit would
// need a shared store (KV/Redis); out of scope for this slice.
const recentByIp = new Map<string, number[]>();

// The visitor's IP, best-effort, from the proxy headers Vercel sets.
function clientIp(): string {
  const req = getRequestEvent()?.request;
  const fwd = req?.headers.get("x-forwarded-for");
  // x-forwarded-for is a comma list (client, proxy₁, …); the client is first.
  return fwd?.split(",")[0]?.trim() || req?.headers.get("x-real-ip") || "unknown";
}

export const submitContact = action(async (formData: FormData) => {
  "use server";
  const config = contactConfigFromEnv();
  const now = Date.now();
  const ip = clientIp();
  // Prune this IP's history to the live window before the policy sees it, so the
  // stored array can't grow unbounded and old sends don't count against them.
  const recent = (recentByIp.get(ip) ?? []).filter(
    (t) => now - t < RATE_LIMIT.windowMs,
  );

  const result = await deliverContact(
    {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      message: String(formData.get("message") ?? ""),
      honeypot: String(formData.get("company") ?? ""),
      now,
      recent,
    },
    createResendTransport(config.apiKey),
    config,
  );

  // Record accepted sends so the next submission from this IP is rate-limited.
  if (result.ok) recentByIp.set(ip, [...recent, now]);
  return result;
}, "submitContact");
